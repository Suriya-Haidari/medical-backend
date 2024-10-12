const getTableName = (option) => {
  const tableMap = {
    doctors: "doctorsposts",
    hospital: "hospitalposts",
    sick: "sickpeopleposts",
  };
  const tableName = tableMap[option];
  if (!tableName) throw new Error("Invalid option");
  return tableName;
};

export default getTableName;
