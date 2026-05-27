import StaffOfficeConsole from "./StaffOfficeConsole";

function ETOStaffPage(props) {
  return <StaffOfficeConsole {...props} officeName={props.officeName || "ETO"} />;
}

export default ETOStaffPage;
