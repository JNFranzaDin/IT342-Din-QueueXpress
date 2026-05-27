import { OFFICES } from "../queueManagement/queueConfig";
import AccountingStaffPage from "./AccountingStaffPage";
import ClinicStaffPage from "./ClinicStaffPage";
import ETOStaffPage from "./ETOStaffPage";
import StaffOfficeConsole from "./StaffOfficeConsole";

const resolveStaffOffice = (user, fallbackOffice = "") => {
  const rawOffice = (user?.office || fallbackOffice || "").toString().trim();
  if (!rawOffice) return "";

  return OFFICES.find((office) => office.toLowerCase() === rawOffice.toLowerCase()) || "";
};

function StaffPage(props) {
  const assignedOffice = resolveStaffOffice(props.user, props.activeOffice);

  if (assignedOffice === "Accounting") {
    return <AccountingStaffPage {...props} officeName={assignedOffice} />;
  }

  if (assignedOffice === "ETO") {
    return <ETOStaffPage {...props} officeName={assignedOffice} />;
  }

  if (assignedOffice === "Clinic") {
    return <ClinicStaffPage {...props} officeName={assignedOffice} />;
  }

  return <StaffOfficeConsole {...props} officeName="" />;
}

export default StaffPage;
