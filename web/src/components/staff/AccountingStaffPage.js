import StaffOfficeConsole from "./StaffOfficeConsole";

function AccountingStaffPage(props) {
  return <StaffOfficeConsole {...props} officeName={props.officeName || "Accounting"} />;
}

export default AccountingStaffPage;
