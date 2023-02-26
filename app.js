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
        }

        this[key].inputDigints.addEventListener("input", function () {
          updateRanges();
        });

        this[key].inputBox.addEventListener("input", function () {
          performInputValidation(this);
        });

        this[key].unitCombo.addEventListener("change", function () {
          updateRanges();
          performInputValidation(this);
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

document.addEventListener("DOMContentLoaded", function () {
  parameterDictionary.completeDict();

  const pressureRadio = document.getElementById("pressure-radio");
  const altitudeRadio = document.getElementById("altitude-radio");
  const pressureInput = document.getElementById("pressure-input");
  const altitudeInput = document.getElementById("altitude-input");
  const pressureUnits = document.getElementById("pressure-units");
  const altitudeUnits = document.getElementById("altitude-units");

  // Initialize Webpage:
  pressureRadio.checked = true;
  PressureAltitudeChecked();
  performPressureAltitude();

  function performPressureAltitude() {
    if (pressureRadio.checked) {
      const pressure = convertPressure(
        pressureInput.value,
        pressureUnits.value,
        "Pa"
      );
      const altitude = calcAltitudebyPressure(pressure);
      altitudeInput.value = convertAltitude(altitude, "m", altitudeUnits.value);
    } else if (altitudeRadio.checked) {
      const altitude = convertAltitude(
        altitudeInput.value,
        altitudeUnits.value,
        "m"
      );
      const pressure = calcPressureByAltitude(altitude);

      pressureInput.value = convertPressure(
        pressure,
        "Pa",
        pressureUnits.value
      );
    }
  }

  pressureInput.addEventListener("input", function () {
    if (performInputValidation(this)) performPressureAltitude();
  });

  altitudeInput.addEventListener("input", function () {
    if (performInputValidation(this)) performPressureAltitude();
  });

  pressureUnits.addEventListener("change", function () {
    if (performInputValidation(this)) performPressureAltitude();
  });

  altitudeUnits.addEventListener("change", function () {
    if (performInputValidation(this)) performPressureAltitude();
  });

  altitudeRadio.addEventListener("click", function () {
    PressureAltitudeChecked();
  });

  pressureRadio.addEventListener("click", function () {
    PressureAltitudeChecked();
  });

  function PressureAltitudeChecked() {
    if (pressureRadio.checked) {
      altitudeInput.style.backgroundColor = "skyblue";
      altitudeInput.setAttribute("readonly", true);

      pressureInput.removeAttribute("readonly");
      pressureInput.style.backgroundColor = "yellow";
      pressureInput.focus();
      pressureInput.select();
    } else if (altitudeRadio.checked) {
      pressureInput.style.backgroundColor = "skyblue";
      pressureInput.setAttribute("readonly", true);

      altitudeInput.removeAttribute("readonly");
      altitudeInput.style.backgroundColor = "yellow";
      altitudeInput.focus();
      altitudeInput.select();
    }
  }
});

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

function calcPressureByAltitude(altitude_m) {
  const P0 = 101325;
  const coeff = 2.25577 * 1e-5;
  const powCoeff = 5.2;
  const p = P0 * Math.pow(1 - coeff * altitude_m, powCoeff);
  return p;
}

function calcAltitudebyPressure(Pressure_Pa) {
  const P0 = 101325;
  const coeff = 2.25577 * 1e-5;
  const powCoeff = 5.2;
  const z = (1 - Math.pow(Pressure_Pa / P0, 1 / powCoeff)) / coeff;
  return z;
}
