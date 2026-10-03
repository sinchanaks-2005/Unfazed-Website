const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = async ({
  invoiceNumber,
  amount,
  currency = "INR",
  payment,
  client,
  therapist,
  packageInfo,
}) => {
  const invoicesDir = path.join(__dirname, "../../public/invoices");

  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const safeInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;
  const fileName = `invoice_${safeInvoiceNumber}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // --------------------------------------------------
  // INVOICE HEADER
  // --------------------------------------------------

  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("UNFAZED", { align: "center" });

  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("TAX INVOICE / RECEIPT", { align: "center" });

  doc.moveDown();

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Invoice Number: ${safeInvoiceNumber}`);

  doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`);

  doc.moveDown();

  // --------------------------------------------------
  // SERVICE PROVIDER
  // --------------------------------------------------

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Service Provider");

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Name: ${therapist?.name || "Therapist"}`);

  if (therapist?.email) {
    doc.text(`Email: ${therapist.email}`);
  }

  doc.moveDown();

  // --------------------------------------------------
  // BILLED CLIENT
  // --------------------------------------------------

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Billed To");

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(`Name: ${client?.name || "Client"}`);

  if (client?.email) {
    doc.text(`Email: ${client.email}`);
  }

  doc.moveDown();

  // --------------------------------------------------
  // PAYMENT / SERVICE DETAILS
  // --------------------------------------------------

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Payment Details");

  doc
    .fontSize(10)
    .font("Helvetica");

  doc.text(`Payment ID: ${payment?.gateway_transaction_id || "N/A"}`);

  doc.text(`Order ID: ${payment?.gateway_order_id || "N/A"}`);

  doc.text(`Payment Status: ${payment?.status || "completed"}`);

  if (payment?.payment_method) {
    doc.text(`Payment Method: ${payment.payment_method}`);
  }

  doc.moveDown();

  // --------------------------------------------------
  // SERVICE DESCRIPTION
  // --------------------------------------------------

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Service");

  doc
    .fontSize(10)
    .font("Helvetica");

  let serviceDescription = "Therapy Session";

  if (packageInfo) {
    serviceDescription = `${packageInfo.name || "Therapy Package"} - ${
      packageInfo.sessionCount || ""
    } Sessions`;
  }

  doc.text(serviceDescription);

  doc.moveDown();

  // --------------------------------------------------
  // GST CALCULATION
  // --------------------------------------------------
  // The amount received from the payment gateway is
  // treated as the FINAL amount paid, inclusive of GST.
  //
  // Example:
  // Amount paid = ₹1180
  // Taxable value = ₹1000
  // GST = ₹180
  // Total = ₹1180
  // --------------------------------------------------

  const totalAmount = Number(amount) || 0;

  const gstRate = 18;

  const taxableValue = totalAmount / (1 + gstRate / 100);

  const gstAmount = totalAmount - taxableValue;

  const cgstAmount = gstAmount / 2;

  const sgstAmount = gstAmount / 2;

  // --------------------------------------------------
  // AMOUNT TABLE
  // --------------------------------------------------

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Amount Details");

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Taxable Value: ${currency} ${taxableValue.toFixed(2)}`
    );

  doc.text(
    `CGST (9%): ${currency} ${cgstAmount.toFixed(2)}`
  );

  doc.text(
    `SGST (9%): ${currency} ${sgstAmount.toFixed(2)}`
  );

  doc.moveDown(0.5);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(
      `Total Amount Paid: ${currency} ${totalAmount.toFixed(2)}`
    );

  doc.moveDown();

  // --------------------------------------------------
  // PAYMENT STATUS
  // --------------------------------------------------

  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Payment Status: PAID");

  doc.moveDown();

  // --------------------------------------------------
  // FOOTER
  // --------------------------------------------------

  doc
    .fontSize(9)
    .font("Helvetica")
    .text(
      "This is a system-generated invoice from UNFAZED.",
      {
        align: "center",
      }
    );

  doc.text(
    "Thank you for using UNFAZED.",
    {
      align: "center",
    }
  );

  doc.end();

  // Wait until the PDF file is completely written.
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return {
    fileName,
    filePath,
    downloadUrl: `/invoices/${fileName}`,
  };
};

module.exports = {
  generateInvoice,
};