import { useState, useEffect } from "react";
import "../dashboard/dashboard.css";

const getPurposeOptionsForOffice = (office) => {
  switch (office) {
    case "Accounting":
      return ["For tuition", "For Vehicle Sticker", "Others"];
    case "ETO":
      return ["Forward Balance", "For Request Form", "Others"];
    case "Clinic":
      return ["For Dental", "For Check up", "Others"];
    default:
      return ["For tuition", "For Vehicle Sticker", "Forward Balance", "Appointment", "Others"];
  }
};

const getTicketFormCopyForOffice = (office) => {
  switch (office) {
    case "Accounting":
      return {
        title: "Accounting Ticket Form",
        subtitle: "Submit your accounting details to get a queue number.",
      };
    case "ETO":
      return {
        title: "ETO Ticket Form",
        subtitle: "Submit your ETO request to get a queue number.",
      };
    case "Clinic":
      return {
        title: "Clinic Ticket Form",
        subtitle: "Submit your clinic request to get a queue number.",
      };
    default:
      return {
        title: `${office || "Office"} Ticket Form`,
        subtitle: "Submit your details to get a queue number.",
      };
  }
};

function GetTicketModal({ office, onClose, onSubmit }) {
  const [idNumber, setIdNumber] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [otherPurpose, setOtherPurpose] = useState("");
  const [amount, setAmount] = useState("");

  const formCopy = getTicketFormCopyForOffice(office);
  const purposeOptions = getPurposeOptionsForOffice(office);

  // Set default purpose when office changes
  useEffect(() => {
    const defaultPurpose = getPurposeOptionsForOffice(office)[0];
    if (defaultPurpose) {
      setPurpose(defaultPurpose);
    }
  }, [office]);

  const showOther = purpose === "Others";

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      idNumber: idNumber.trim(),
      name: name.trim(),
      purpose: showOther ? otherPurpose.trim() || "Others" : purpose,
      amount: amount.trim(),
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="get-ticket-title" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h3 id="get-ticket-title">{formCopy.title}</h3>
          <p className="modal-subtitle">{formCopy.subtitle}</p>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            ID Number
            <input value={idNumber} onChange={(event) => setIdNumber(event.target.value)} required />
          </label>

          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Purpose
            <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
              {purposeOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>

          {showOther ? (
            <label>
              State your purpose
              <input value={otherPurpose} onChange={(event) => setOtherPurpose(event.target.value)} required />
            </label>
          ) : null}

          <label>
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={office === "Accounting" ? "Enter amount if applicable" : "Optional"} />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Get Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GetTicketModal;