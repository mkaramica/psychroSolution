class Range {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }

  contains(value) {
    return value >= this.min && value <= this.max;
  }
}

const pressureRange = new Range(5000, 1e6); // Pa
const tempRange = new Range(-100, 100); // C
const altitudeRange = new Range(-5000, 11000); // m

const parameterDictionary = {
  temp: { objRange: tempRange, convertingFunc: convertTemp, fromUnit: "C" },
  pressure: {
    objRange: pressureRange,
    convertingFunc: convertPressure,
    fromUnit: "Pa",
  },
  altitude: {
    objRange: altitudeRange,
    convertingFunc: convertAltitude,
    fromUnit: "m",
  },

  completeDict: function () {
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== "completeDict") {
        this[key].labelRangeMin = document.getElementById(
          "range-" + key + "Min"
        );
        this[key].labelRangeMax = document.getElementById(
          "range-" + key + "Max"
        );
        this[key].unitCombo = document.getElementById(key + "-units");
        this[key].inputDigints = document.getElementById(key + "-digits");
        this[key].inputBox = document.getElementById(key + "-input");

        if (key !== "temp") {
          this[key].radioButton = document.getElementById(key + "-radio");
          this[key].radioButton.addEventListener("click", function () {
            handleCheckBoxes();
          });
        }

        this[key].inputDigints.addEventListener("input", function () {
          updateRanges();
          if (key === "pressure" || key === "altitude") {
            performPressureAltitudeCalc();
          }
        });

        this[key].inputBox.addEventListener("input", function () {
          const isValid = performInputValidation(this);
          if (key === "pressure" || key === "altitude") {
            if (isValid) performPressureAltitudeCalc();
          }
        });

        this[key].unitCombo.addEventListener("change", function () {
          updateRanges();
          const isValid = performInputValidation(this);
          if (key === "pressure" || key === "altitude") {
            if (isValid) performPressureAltitudeCalc();
          }
        });
      }
    }
  },
};

function updateRanges() {
  for (const key in parameterDictionary) {
    if (parameterDictionary.hasOwnProperty(key) && key !== "completeDict") {
      parameterDictionary[key].labelRangeMin.innerHTML = parameterDictionary[
        key
      ]
        .convertingFunc(
          (value = parameterDictionary[key].objRange.min),
          (fromUnit = parameterDictionary[key].fromUnit),
          (toUnit = parameterDictionary[key].unitCombo.value)
        )
        .toFixed(parameterDictionary[key].inputDigints.value);
      parameterDictionary[key].labelRangeMax.innerHTML = parameterDictionary[
        key
      ]
        .convertingFunc(
          (value = parameterDictionary[key].objRange.max),
          (fromUnit = parameterDictionary[key].fromUnit),
          (toUnit = parameterDictionary[key].unitCombo.value)
        )
        .toFixed(parameterDictionary[key].inputDigints.value);
    }
  }
}

function performInputValidation(callingElement) {
  const dictKey = callingElement.id.split("-")[0];
  const inputBox = parameterDictionary[dictKey].inputBox;
  if (inputBox.readOnly) {
    return true;
  }
  const unitCombo = parameterDictionary[dictKey].unitCombo;
  const convertingFunc = parameterDictionary[dictKey].convertingFunc;
  const objRange = parameterDictionary[dictKey].objRange;

  const inputValue = convertingFunc(inputBox.value, unitCombo.value);

  if (
    inputBox.value === "" ||
    isNaN(inputBox.value) ||
    !objRange.contains(inputValue)
  ) {
    inputBox.style.backgroundColor = "red";
    return false;
  } else {
    inputBox.style.backgroundColor = "yellow";
    return true;
  }
}

function performPressureAltitudeCalc() {
  let inputKey, outputKey;
  if (parameterDictionary["pressure"].radioButton.checked) {
    inputKey = "pressure";
    outputKey = "altitude";
  } else {
    inputKey = "altitude";
    outputKey = "pressure";
  }

  const dictInput = parameterDictionary[inputKey];
  const dictOutput = parameterDictionary[outputKey];

  const valInput = dictInput.convertingFunc(
    dictInput.inputBox.value,
    dictInput.unitCombo.value
  );

  const valOutput = calcPressureAltitude(valInput, inputKey);

  dictOutput.inputBox.value = dictOutput
    .convertingFunc(valOutput, dictOutput.fromUnit, dictOutput.unitCombo.value)
    .toFixed(dictOutput.inputDigints.value);
}

document.addEventListener("DOMContentLoaded", function () {
  parameterDictionary.completeDict();
  // Initialize Webpage:
  parameterDictionary["pressure"].radioButton.checked = true;
  handleCheckBoxes();
  performPressureAltitudeCalc();
});

function handleCheckBoxes() {
  const keyGRoup = ["pressure", "altitude"];

  for (const key of keyGRoup) {
    let inputbox = parameterDictionary[key].inputBox;
    if (parameterDictionary[key].radioButton.checked) {
      inputbox.removeAttribute("readonly");
      inputbox.style.backgroundColor = "yellow";
      inputbox.focus();
      inputbox.select();
    } else {
      inputbox.style.backgroundColor = "skyblue";
      inputbox.setAttribute("readonly", true);
    }
  }
}

function convertPressure(value, fromUnit, toUnit = "Pa") {
  const units = {
    Pa: 1,
    kPa: 1000,
    Bar: 100000,
    mBar: 100,
    "mm H2O": 9.80665,
    "mm Hg": 133.322,
    Atmosphere: 101325,
    PSI: 6894.76,
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!units[fromUnit] || !units[toUnit]) {
    return null; // invalid unit provided
  }

  const pascalValue = value * units[fromUnit];
  const result = pascalValue / units[toUnit];

  return result;
}

function convertTemp(value, fromUnit, toUnit = "C") {
  const fromUnitsToKelvin = {
    C: (val) => val + 273.15,
    K: (val) => val,
    F: (val) => (5 / 9) * val + 273.15,
    R: (val) => val * (5 / 9),
  };

  const fromKelvinToUnits = {
    C: (val) => val - 273.15,
    K: (val) => val,
    F: (val) => val * (9 / 5) - 459.67,
    R: (val) => val * (9 / 5),
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!fromUnitsToKelvin[fromUnit] || !fromUnitsToKelvin[toUnit]) {
    return null; // invalid unit provided
  }

  // convert input value to Kelvin
  const kelvinValue =
    fromUnit === "K" ? value : fromUnitsToKelvin[fromUnit](value);

  // convert Kelvin value to desired output unit
  const result =
    toUnit === "K" ? kelvinValue : fromKelvinToUnits[toUnit](kelvinValue);

  return result;
}

function convertAltitude(value, fromUnit, toUnit = "m") {
  const units = {
    m: 1,
    km: 1000,
    ft: 0.3048,
    mile: 1609.344,
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!units[fromUnit] || !units[toUnit]) {
    return null; // invalid unit provided
  }

  const meterValue = value * units[fromUnit];
  const result = meterValue / units[toUnit];

  return result;
}

function calcPressureAltitude(inputValue, key) {
  const P0 = 101325;
  const coeff = 2.25577 * 1e-5;
  const powCoeff = 5.2;
  return key === "pressure"
    ? (1 - Math.pow(inputValue / P0, 1 / powCoeff)) / coeff
    : P0 * Math.pow(1 - coeff * inputValue, powCoeff);
}
