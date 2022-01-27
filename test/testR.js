const R = require("r-integration");

const testScript = async (scriptName, functionName) => {
    try {
        let data = await R.callMethodAsync(scriptName, functionName, {
            x: 1
        });
        data.forEach(element => {
            if(!(element === "Test passed" || element) ){
                console.log(`R Test failed: ${scriptName}`);
                return false;
            }
        });
        console.log(`All ${data.length} R Test(s) passed for script: ${scriptName}`);	
        return true;
    } catch (e) {
        console.log("R Test failed: " + scriptName);	
        return false;
    }
}

scriptsToTest = [
    {
        scriptName: "./testGetSatelliteImages.R",
        functionName: "test"
    }
]

for (let i = 0; i < scriptsToTest.length; i++) {
    testScript(scriptsToTest[i].scriptName, scriptsToTest[i].functionName);
}

