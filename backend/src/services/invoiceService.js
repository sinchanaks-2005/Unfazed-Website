const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate a GST-style invoice PDF.
 * Returns the relative file path and buffer.
 */
const generateInvoice = async ({
  invoiceNumber,
  paymentDate = new Date(),
  therapistName,
  therapistEmail,
  clientName,
  clientEmail,
  serviceDescription = "Therapy Consultation Session",
  amount, // in INR (e.g. 1500)
  transactionId,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../../public/invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `invoice_${invoiceNumber || Date.now()}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- HEADER ---
      doc
        .fillColor("#263b69")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("UNFAZED", 50, 50);

      doc
        .fillColor("#6e60d5")
        .fontSize(10)
        .font("Helvetica")
        .text("TAX INVOICE / RECEIPT", 50, 75);

      doc
        .fillColor("#72758a")
        .fontSize(9)
        .text(`Invoice No: ${invoiceNumber || "INV-" + Date.now()}`, 400, 50, { align: "right" })
        .text(`Date: ${new Date(paymentDate).toLocaleDateString()}`, 400, 65, { align: "right" })
        .text(`Txn ID: ${transactionId || "N/A"}`, 400, 80, { align: "right" });

      doc.moveTo(50, 105).lineTo(550, 105).strokeColor("#e8e9f2").stroke();

      // --- BILLING PARTIES ---
      doc
        .fillColor("#263b69")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Service Provider (Therapist):", 50, 120);

      doc
        .fillColor("#303047")
        .fontSize(10)
        .font("Helvetica")
        .text(therapistName || "Licensed Therapist", 50, 138)
        .text(therapistEmail || "provider@unfazed.in", 50, 152)
        .text("Practice managed via UNFAZED Healthcare Platform", 50, 166);

      doc
        .fillColor("#263b69")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Billed To (Client):", 320, 120);

      doc
        .fillColor("#303047")
        .fontSize(10)
        .font("Helvetica")
        .text(clientName || "Valued Client", 320, 138)
        .text(clientEmail || "client@example.com", 320, 152);

      doc.moveTo(50, 195).lineTo(550, 195).strokeColor("#e8e9f2").stroke();

      // --- LINE ITEMS TABLE ---
      const tableTop = 215;
      doc
        .rect(50, tableTop, 500, 25)
        .fillColor("#f7f8fc")
        .fill();

      doc
        .fillColor("#263b69")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Description", 60, tableTop + 7)
        .text("Qty", 350, tableTop + 7)
        .text("Rate (INR)", 400, tableTop + 7)
        .text("Total (INR)", 480, tableTop + 7);

      const baseAmount = Number(amount) || 1000;
      const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
      const totalAmount = baseAmount + gstAmount;

      const itemY = tableTop + 35;
      doc
        .fillColor("#303047")
        .font("Helvetica")
        .fontSize(10)
        .text(serviceDescription, 60, itemY)
        .text("1", 350, itemY)
        .text(`₹${baseAmount.toFixed(2)}`, 400, itemY)
        .text(`₹${baseAmount.toFixed(2)}`, 480, itemY);

      doc.moveTo(50, itemY + 25).lineTo(550, itemY + 25).strokeColor("#f0f1f7").stroke();

      // --- TOTALS BREAKDOWN (GST) ---
      const subtotalY = itemY + 40;
      doc
        .fillColor("#72758a")
        .fontSize(10)
        .text("Taxable Value:", 350, subtotalY)
        .text(`₹${baseAmount.toFixed(2)}`, 480, subtotalY)
        .text("CGST (9%):", 350, subtotalY + 16)
        .text(`₹${(gstAmount / 2).toFixed(2)}`, 480, subtotalY + 16)
        .text("SGST (9%):", 350, subtotalY + 32)
        .text(`₹${(gstAmount / 2).toFixed(2)}`, 480, subtotalY + 32);

      doc.moveTo(350, subtotalY + 52).lineTo(550, subtotalY + 52).strokeColor("#263b69").stroke();

      doc
        .fillColor("#263b69")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Total Paid:", 350, subtotalY + 60)
        .text(`₹${totalAmount.toFixed(2)}`, 480, subtotalY + 60);

      // --- FOOTER ---
      doc
        .fillColor("#888a9e")
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for choosing UNFAZED. For queries, contact support@unfazed.in.", 50, 680, {
          align: "center",
        })
        .text("Computer generated invoice. No signature required.", 50, 695, {
          align: "center",
        });

      doc.end();

      writeStream.on("finish", () => {
        resolve({
          fileName,
          filePath,
          downloadUrl: `/invoices/${fileName}`,
        });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoice,
};

