import "./UpgradeModal.css";

function UpgradeModal({ isOpen, onClose, featureName, requiredTier, message }) {
  if (!isOpen) return null;

  return (
    <div className="upgrade-modal-backdrop">
      <div className="upgrade-modal-card">
        <div className="upgrade-modal-crown">👑</div>
        <span className="upgrade-badge">UNFAZED {requiredTier?.toUpperCase()}</span>
        <h2>Unlock {featureName || "Premium Feature"}</h2>
        <p className="upgrade-message">
          {message ||
            `This capability is available exclusively to therapists on the ${requiredTier} plan.`}
        </p>

        <div className="tier-benefit-box">
          <div className="benefit-item">
            <span>✓</span> Unlimited or expanded client capacity
          </div>
          <div className="benefit-item">
            <span>✓</span> SOAP & DAP structured clinical templates
          </div>
          <div className="benefit-item">
            <span>✓</span> In-depth practice revenue & retention analytics
          </div>
          <div className="benefit-item">
            <span>✓</span> Custom packages & automated GST invoicing
          </div>
        </div>

        <div className="upgrade-actions">
          <button
            type="button"
            className="upgrade-btn-primary"
            onClick={() => {
              alert(
                `Upgrade to ${requiredTier?.toUpperCase()} plan requested! Our team will activate your subscription.`
              );
              onClose();
            }}
          >
            Upgrade Practice Now
          </button>
          <button
            type="button"
            className="upgrade-btn-secondary"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;

