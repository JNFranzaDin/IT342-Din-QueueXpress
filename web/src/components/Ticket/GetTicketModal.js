import { useEffect, useMemo, useState } from "react";
import "../dashboard/dashboard.css";

function GetTicketModal({ office, onClose, onSubmit }) {
  const [idNumber, setIdNumber] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [otherPurpose, setOtherPurpose] = useState("");
  const [amount, setAmount] = useState("");

  const purposeOptions = useMemo(() => {
    switch (office) {
      case "Accounting":
        return ["For tuition", "For Vehicle Sticker", "Others"];
      case "ETO":
        return ["Forward Balance", "For Request Form", "Others"];
      case "Clinic":
        return ["For Dental", "For Check up", "Others"];
      default:
        return ["For tuition", "For Vehicle Sticker", "Others"];
    }
  }, [office]);

  useEffect(() => {
    if (purposeOptions.length > 0) {
      setPurpose(purposeOptions[0]);
    }
    setOtherPurpose("");
  }, [purposeOptions]);

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
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="get-ticket-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="get-ticket-title">Get Ticket - {office}</h3>
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
              {purposeOptions.map((option) => (
                <option key={option}>{option}</option>
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
            <input value={amount} onChange={(event) => setAmount(event.target.value)} />
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
