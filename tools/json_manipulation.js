const fs = require("fs");

// Updates the servers config json
function jsonFileUpdate(filepath, attribute, newVal) {
    let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
    configFile[attribute] = newVal;
    fs.writeFileSync(filepath, JSON.stringify(configFile));
  }
  
  // Reads the servers config json
  function jsonFileReader(filepath) {
    let configFile = JSON.parse(fs.readFileSync(filepath, "utf8"));
    return configFile;
  }

  module.exports = { jsonFileUpdate, jsonFileReader};