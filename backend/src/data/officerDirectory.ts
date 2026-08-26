/**
 * Officer Directory — mock data for the State/UT Nodal Cyber Cell & Grievance Officer directory.
 * This is a PROTOTYPE with clearly fictional contact information.
 */

export interface OfficerDirectoryEntry {
  state: string;
  nodalOfficer: { name: string; rank: string; email: string };
  grievanceOfficer: { name: string; rank: string; contact: string };
}

export const officerDirectory: OfficerDirectoryEntry[] = [
  {
    state: "Andhra Pradesh",
    nodalOfficer: { name: "Rajesh K. Varma", rank: "DIG, Cyber Crime", email: "nodal.ap@example.gov.in" },
    grievanceOfficer: { name: "Sunita Reddy", rank: "SP", contact: "1800-425-0001" },
  },
  {
    state: "Arunachal Pradesh",
    nodalOfficer: { name: "Tenzin Dorjee", rank: "SP, Cyber Crime", email: "nodal.ar@example.gov.in" },
    grievanceOfficer: { name: "Pema Tsering", rank: "Addl. SP", contact: "1800-425-0002" },
  },
  {
    state: "Assam",
    nodalOfficer: { name: "Diganta Baruah", rank: "DIG, CID", email: "nodal.assam@example.gov.in" },
    grievanceOfficer: { name: "Anjali Kalita", rank: "SP", contact: "1800-425-0003" },
  },
  {
    state: "Bihar",
    nodalOfficer: { name: "Amit Kumar Sinha", rank: "DIG, Cyber Cell", email: "nodal.bihar@example.gov.in" },
    grievanceOfficer: { name: "Priya Ranjan", rank: "SP", contact: "1800-425-0004" },
  },
  {
    state: "Chhattisgarh",
    nodalOfficer: { name: "Vikram Singh Mandavi", rank: "SP, Cyber Crime", email: "nodal.cg@example.gov.in" },
    grievanceOfficer: { name: "Kavita Nagesh", rank: "Addl. SP", contact: "1800-425-0005" },
  },
  {
    state: "Goa",
    nodalOfficer: { name: "Aditya Ankush Dessai", rank: "SP, Cyber Cell", email: "nodal.goa@example.gov.in" },
    grievanceOfficer: { name: "Meera Khandeparkar", rank: "DySP", contact: "1800-425-0006" },
  },
  {
    state: "Gujarat",
    nodalOfficer: { name: "Hitesh Jayswal", rank: "DIG, Cyber Crime", email: "nodal.gujarat@example.gov.in" },
    grievanceOfficer: { name: "Bhavna Joshi", rank: "SP", contact: "1800-425-0007" },
  },
  {
    state: "Haryana",
    nodalOfficer: { name: "Manoj Kumar Tomar", rank: "DIG, Cyber Crime", email: "nodal.haryana@example.gov.in" },
    grievanceOfficer: { name: "Sapna Chauhan", rank: "SP", contact: "1800-425-0008" },
  },
  {
    state: "Himachal Pradesh",
    nodalOfficer: { name: "Rajinder Singh Rana", rank: "SP, Cyber Cell", email: "nodal.hp@example.gov.in" },
    grievanceOfficer: { name: "Neelam Chauhan", rank: "DySP", contact: "1800-425-0009" },
  },
  {
    state: "Jharkhand",
    nodalOfficer: { name: "Anoop Birsa", rank: "DIG, Cyber Crime", email: "nodal.jharkhand@example.gov.in" },
    grievanceOfficer: { name: "Arti Kumari", rank: "SP", contact: "1800-425-0010" },
  },
  {
    state: "Karnataka",
    nodalOfficer: { name: "S. Ravi Shankar", rank: "IGP, Cyber Crime", email: "nodal.karnataka@example.gov.in" },
    grievanceOfficer: { name: "Lakshmi Prasad", rank: "SP", contact: "1800-425-0011" },
  },
  {
    state: "Kerala",
    nodalOfficer: { name: "Harikrishnan Namboothiri", rank: "DIG, Cyber Crime", email: "nodal.kerala@example.gov.in" },
    grievanceOfficer: { name: "Divya P. Nair", rank: "SP", contact: "1800-425-0012" },
  },
  {
    state: "Madhya Pradesh",
    nodalOfficer: { name: "Deepak Kumar Verma", rank: "DIG, Cyber Cell", email: "nodal.mp@example.gov.in" },
    grievanceOfficer: { name: "Rekha Mishra", rank: "SP", contact: "1800-425-0013" },
  },
  {
    state: "Maharashtra",
    nodalOfficer: { name: "Prakash D. Surse", rank: "IGP, Cyber Crime", email: "nodal.maharashtra@example.gov.in" },
    grievanceOfficer: { name: "Nisha Deshpande", rank: "DIG", contact: "1800-425-0014" },
  },
  {
    state: "Manipur",
    nodalOfficer: { name: "Kh. Achin Singh", rank: "SP, Cyber Crime", email: "nodal.manipur@example.gov.in" },
    grievanceOfficer: { name: "Laishram Chitra", rank: "Addl. SP", contact: "1800-425-0015" },
  },
  {
    state: "Meghalaya",
    nodalOfficer: { name: "RLF Sangma", rank: "SP, Cyber Cell", email: "nodal.meghalaya@example.gov.in" },
    grievanceOfficer: { name: "Banrilyn Kharbangar", rank: "DySP", contact: "1800-425-0016" },
  },
  {
    state: "Mizoram",
    nodalOfficer: { name: "Lalnunmawia Chhangte", rank: "SP, Cyber Crime", email: "nodal.mizoram@example.gov.in" },
    grievanceOfficer: { name: "Vanlalfamzuali", rank: "Addl. SP", contact: "1800-425-0017" },
  },
  {
    state: "Nagaland",
    nodalOfficer: { name: "Wabang Jamir", rank: "SP, Cyber Cell", email: "nodal.nagaland@example.gov.in" },
    grievanceOfficer: { name: "Renzulemo Odyuo", rank: "DySP", contact: "1800-425-0018" },
  },
  {
    state: "Odisha",
    nodalOfficer: { name: "Soumendra K. Priyadarshi", rank: "DIG, Cyber Crime", email: "nodal.odisha@example.gov.in" },
    grievanceOfficer: { name: "Sasmita Sahu", rank: "SP", contact: "1800-425-0019" },
  },
  {
    state: "Punjab",
    nodalOfficer: { name: "Munish Chawla", rank: "DIG, Cyber Crime", email: "nodal.punjab@example.gov.in" },
    grievanceOfficer: { name: "Gurpreet Kaur", rank: "SP", contact: "1800-425-0020" },
  },
  {
    state: "Rajasthan",
    nodalOfficer: { name: "Dinesh M. Nagar", rank: "DIG, Cyber Cell", email: "nodal.rajasthan@example.gov.in" },
    grievanceOfficer: { name: "Pooja Vashisht", rank: "SP", contact: "1800-425-0021" },
  },
  {
    state: "Sikkim",
    nodalOfficer: { name: "Tashi Dadul Bhutia", rank: "SP, Cyber Crime", email: "nodal.sikkim@example.gov.in" },
    grievanceOfficer: { name: "Diki Lhamu Sherpa", rank: "DySP", contact: "1800-425-0022" },
  },
  {
    state: "Tamil Nadu",
    nodalOfficer: { name: "Arun Balakrishnan", rank: "IGP, Cyber Crime", email: "nodal.tn@example.gov.in" },
    grievanceOfficer: { name: "Kavitha S. Rajan", rank: "DIG", contact: "1800-425-0023" },
  },
  {
    state: "Telangana",
    nodalOfficer: { name: "Swati Lakra", rank: "IGP, Cyber Crime", email: "nodal.telangana@example.gov.in" },
    grievanceOfficer: { name: "Y. Prashanthi Reddy", rank: "SP", contact: "1800-425-0024" },
  },
  {
    state: "Tripura",
    nodalOfficer: { name: "Arindam Dutta", rank: "SP, Cyber Cell", email: "nodal.tripura@example.gov.in" },
    grievanceOfficer: { name: "Mamata Debbarma", rank: "Addl. SP", contact: "1800-425-0025" },
  },
  {
    state: "Uttar Pradesh",
    nodalOfficer: { name: "Navneet Ratan Rana", rank: "IGP, Cyber Crime", email: "nodal.up@example.gov.in" },
    grievanceOfficer: { name: "Shalini Sharma", rank: "DIG", contact: "1800-425-0026" },
  },
  {
    state: "Uttarakhand",
    nodalOfficer: { name: "Pushpak Kumar Juyal", rank: "SP, Cyber Cell", email: "nodal.uk@example.gov.in" },
    grievanceOfficer: { name: "Neha Dimri", rank: "DySP", contact: "1800-425-0027" },
  },
  {
    state: "West Bengal",
    nodalOfficer: { name: "Supratim Mitra", rank: "DIG, Cyber Crime", email: "nodal.wb@example.gov.in" },
    grievanceOfficer: { name: "Arpita Ghosh", rank: "SP", contact: "1800-425-0028" },
  },
  {
    state: "Andaman & Nicobar Islands",
    nodalOfficer: { name: "Devendra Kumar Mehta", rank: "SP", email: "nodal.an@example.gov.in" },
    grievanceOfficer: { name: "Geeta Ratnam", rank: "DySP", contact: "1800-425-0029" },
  },
  {
    state: "Chandigarh",
    nodalOfficer: { name: "Harpreet Singh Mand", rank: "SP, Cyber Cell", email: "nodal.chandigarh@example.gov.in" },
    grievanceOfficer: { name: "Neha Garg", rank: "DSP", contact: "1800-425-0030" },
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    nodalOfficer: { name: "Jignesh C. Patil", rank: "SP", email: "nodal.dnhdd@example.gov.in" },
    grievanceOfficer: { name: "Reshma Patel", rank: "DySP", contact: "1800-425-0031" },
  },
  {
    state: "Delhi",
    nodalOfficer: { name: "Shalini Singh", rank: "DCP, Cyber Crime", email: "nodal.delhi@example.gov.in" },
    grievanceOfficer: { name: "Ruchika Gupta", rank: "ACP", contact: "1800-425-0032" },
  },
  {
    state: "Jammu & Kashmir",
    nodalOfficer: { name: "Imtiaz Ismail Parray", rank: "SSP, Cyber Cell", email: "nodal.jk@example.gov.in" },
    grievanceOfficer: { name: "Sumira Dedmari", rank: "DySP", contact: "1800-425-0033" },
  },
  {
    state: "Ladakh",
    nodalOfficer: { name: "Tashi Namgyal Yakzee", rank: "SSP", email: "nodal.ladakh@example.gov.in" },
    grievanceOfficer: { name: "Stanzin Dolkar", rank: "DySP", contact: "1800-425-0034" },
  },
  {
    state: "Lakshadweep",
    nodalOfficer: { name: "Rizwan K. Mohammed", rank: "SP", email: "nodal.lakshadweep@example.gov.in" },
    grievanceOfficer: { name: "Fathima Beevi", rank: "Inspector", contact: "1800-425-0035" },
  },
  {
    state: "Puducherry",
    nodalOfficer: { name: "Ravivarman Subbulakshmi", rank: "SP, Cyber Cell", email: "nodal.puducherry@example.gov.in" },
    grievanceOfficer: { name: "Kamala Kannan", rank: "DySP", contact: "1800-425-0036" },
  },
];
