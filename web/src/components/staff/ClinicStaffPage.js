import StaffOfficeConsole from "./StaffOfficeConsole";

function ClinicStaffPage(props) {
  return <StaffOfficeConsole {...props} officeName={props.officeName || "Clinic"} />;
}

export default ClinicStaffPage;
