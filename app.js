const MW_water = 18.01528;
const MW_dryAir = 28.9645;
const Ru = 8.31441;

class Range {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }

  contains(value) {
    return value >= this.min && value <= this.max;
  }
}

const pressureRange = new Range((min = 5000), (max = 1e6)); // Pa
const temperatureRange = new Range((min = -100), (max = 100)); // C
const altitudeRange = new Range((min = -5000), (max = 11000)); // m

const relHumidRange = new Range((min = 0), (max = 1)); // -
const absHumidRange = new Range((min = 0), (max = 1)); // (kg moisture)/m^3
const humidRatioRange = new Range((min = 0), (max = 1)); // (g moisture)/(kg dry air)
const dewPointTempRange = new Range((min = -100), (max = 100)); // C
const wetBulbTempRange = new Range((min = -100), (max = 100)); // C
const waterPartPreseRange = new Range((min = 0), (max = 3000)); // Pa
const moleFracRange = new Range((min = 0), (max = 1)); // -
const massFracRange = new Range((min = 0), (max = 1)); // -

const sectionDict = {
  Temperature: ["Temperature"],
  Pressure: ["Pressure", "Altitude"],
  Humidity: [
    "Relative Humidity",
    "Humidity Ratio",
    "Absolute Humidity",
    "Dew Point Temperature",
    "Wet Bulb Temperature",
    "Water Partial Pressure",
    "Water Mole Fraction",
    "Water Mass Fraction",
  ],
};

const parameterDictionary = {
  Temperature: {
    objRange: temperatureRange,
    convertingFunc: convertTemperature,
    fromUnit: "C",
    units: [
      { value: "C", label: "Celsius" },
      { value: "F", label: "Fahrenheit" },
      { value: "K", label: "Kelvin" },
      { value: "R", label: "Rankine" },
    ],
  },

  Pressure: {
    objRange: pressureRange,
    convertingFunc: convertPressure,
    fromUnit: "Pa",
    units: [
      { value: "Pa", label: "Pa" },
      { value: "kPa", label: "kPa" },
      { value: "Bar", label: "Bar" },
      { value: "mBar", label: "mBar" },
      { value: "mm H2O", label: "mm H2O" },
      { value: "mm Hg", label: "mm Hg" },
      { value: "Atmosphere", label: "Atmosphere" },
      { value: "PSI", label: "PSI" },
    ],
  },
  Altitude: {
    objRange: altitudeRange,
    convertingFunc: convertAltitude,
    fromUnit: "m",
    units: [
      { value: "m", label: "m" },
      { value: "ft", label: "ft" },
      { value: "km", label: "km" },
      { value: "mile", label: "mile" },
    ],
  },

  "Relative Humidity": {
    objRange: relHumidRange,
    convertingFunc: convertPercent,
    fromUnit: "-",
    units: [
      { value: "-", label: "-" },
      { value: "%", label: "%" },
    ],
  },
  "Absolute Humidity": {
    objRange: absHumidRange,
    convertingFunc: convertAbsHumidity,
    fromUnit: "(kg moisture)/m^3",
    units: [
      { value: "(kg moisture)/m^3", label: "(kg moisture)/m^3" },
      { value: "(g moisture)/m^3", label: "(g moisture)/m^3" },
      { value: "(lb moisture)/ft^3", label: "(lb moisture)/ft^3" },
    ],
  },

  "Humidity Ratio": {
    objRange: humidRatioRange,
    convertingFunc: convertHumidRatio,
    fromUnit: "(g moisture)/(kg dry air)",
    units: [
      {
        value: "(g moisture)/(kg dry air)",
        label: "(g moisture)/(kg dry air)",
      },
      {
        value: "(kg moisture)/(kg dry air)",
        label: "(kg moisture)/(kg dry air)",
      },
      {
        value: "(lb moisture)/(lb dry air)",
        label: "(lb moisture)/(lb dry air)",
      },
    ],
  },

  "Dew Point Temperature": {
    objRange: dewPointTempRange,
    convertingFunc: convertTemperature,
    fromUnit: "C",
    units: [
      { value: "C", label: "Celsius" },
      { value: "F", label: "Fahrenheit" },
      { value: "K", label: "Kelvin" },
      { value: "R", label: "Rankine" },
    ],
  },

  "Wet Bulb Temperature": {
    objRange: wetBulbTempRange,
    convertingFunc: convertTemperature,
    fromUnit: "C",
    units: [
      { value: "C", label: "Celsius" },
      { value: "F", label: "Fahrenheit" },
      { value: "K", label: "Kelvin" },
      { value: "R", label: "Rankine" },
    ],
  },

  "Water Partial Pressure": {
    objRange: waterPartPreseRange,
    convertingFunc: convertPressure,
    fromUnit: "Pa",
    units: [
      { value: "Pa", label: "Pa" },
      { value: "kPa", label: "kPa" },
      { value: "Bar", label: "Bar" },
      { value: "mBar", label: "mBar" },
      { value: "mm H2O", label: "mm H2O" },
      { value: "mm Hg", label: "mm Hg" },
      { value: "Atmosphere", label: "Atmosphere" },
      { value: "PSI", label: "PSI" },
    ],
  },

  "Water Mole Fraction": {
    objRange: moleFracRange,
    convertingFunc: convertPercent,
    fromUnit: "-",
    units: [
      { value: "-", label: "-" },
      { value: "%", label: "%" },
    ],
  },

  "Water Mass Fraction": {
    objRange: massFracRange,
    convertingFunc: convertPercent,
    fromUnit: "-",
    units: [
      { value: "-", label: "-" },
      { value: "%", label: "%" },
    ],
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

        if (key !== "Temperature") {
          this[key].radioButton = document.getElementById(key + "-radio");
          this[key].radioButton.addEventListener("click", function () {
            handleCheckBoxes(key);
          });
        }

        this[key].inputDigints.addEventListener("input", function () {
          updateRanges();
          if (["Pressure", "Altitude", "Temperature"].includes(key)) {
            performPressureCalculations();
            performHumidityCalculations();
          }
          if (sectionDict["Humidity"].includes(key)) {
            performHumidityCalculations();
          }
        });

        this[key].inputBox.addEventListener("input", function () {
          const isValid = performInputValidation(this);
          if (isValid) {
            if (["Pressure", "Altitude", "Temperature"].includes(key)) {
              performPressureCalculations();

              // Validate Humidity Input
              let activeHumidelement = undefined;
              for (const param of sectionDict["Humidity"]) {
                if (
                  parameterDictionary[param].hasOwnProperty("radioButton") &&
                  parameterDictionary[param].radioButton.checked
                ) {
                  activeHumidelement = document.getElementById(
                    param + "-input"
                  );
                  break;
                }
              }
              const isHumidelementValid =
                performInputValidation(activeHumidelement);

              if (isHumidelementValid) {
                performHumidityCalculations();
              }
              //----------
            }
            if (sectionDict["Humidity"].includes(key)) {
              performHumidityCalculations();
            }
          }
        });

        this[key].unitCombo.addEventListener("change", function () {
          updateRanges();
          const isValid = performInputValidation(this);

          if (isValid) {
            if (["Pressure", "Altitude", "Temperature"].includes(key)) {
              performPressureCalculations();

              // Validate Humidity Input
              let activeHumidelement = undefined;
              for (const param of sectionDict["Humidity"]) {
                if (
                  parameterDictionary[param].hasOwnProperty("radioButton") &&
                  parameterDictionary[param].radioButton.checked
                ) {
                  activeHumidelement = document.getElementById(
                    param + "-input"
                  );
                  break;
                }
              }
              const isHumidelementValid =
                performInputValidation(activeHumidelement);

              if (isHumidelementValid) {
                performHumidityCalculations();
              }
              //----------
              performHumidityCalculations();
            }
            if (sectionDict["Humidity"].includes(key)) {
              performHumidityCalculations();
            }
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

function performPressureCalculations() {
  let calcResults;
  for (itemKey of sectionDict["Pressure"]) {
    if (parameterDictionary[itemKey].radioButton.checked) {
      const dictInput = parameterDictionary[itemKey];
      const inputValue = dictInput.convertingFunc(
        dictInput.inputBox.value,
        dictInput.unitCombo.value
      );
      calcResults = calcPressureAltitude(inputValue, itemKey);
      break;
    }
  }

  for (itemKey of sectionDict["Pressure"]) {
    if (!parameterDictionary[itemKey].radioButton.checked) {
      const dictOutput = parameterDictionary[itemKey];
      const valOutput = calcResults[itemKey];
      dictOutput.inputBox.value = dictOutput
        .convertingFunc(
          valOutput,
          dictOutput.fromUnit,
          dictOutput.unitCombo.value
        )
        .toFixed(dictOutput.inputDigints.value);
    }
  }
  const {
    Tin,
    TwbMin,
    Pg,
    absHumidMax,
    HumidRatioMax,
    moleFracH2OMax,
    massFracH2oMax,
  } = calcHumidityRange();

  wetBulbTempRange.min = TwbMin;
  wetBulbTempRange.max = Tin;
  dewPointTempRange.max = Tin;
  absHumidRange.max = absHumidMax;
  humidRatioRange.max = HumidRatioMax;
  waterPartPreseRange.max = Pg;
  moleFracRange.max = moleFracH2OMax;
  massFracRange.max = massFracH2oMax;

  updateRanges();
}

function initializePage() {
  parameterDictionary["Temperature"].inputBox.value = "25";

  parameterDictionary["Pressure"].radioButton.checked = true;
  parameterDictionary["Pressure"].unitCombo.value = "kPa";
  parameterDictionary["Pressure"].inputBox.value = "101.325";

  parameterDictionary["Relative Humidity"].radioButton.checked = true;
  parameterDictionary["Relative Humidity"].unitCombo.value = "%";
  parameterDictionary["Relative Humidity"].inputBox.value = "50";

  parameterDictionary["Absolute Humidity"].unitCombo.value = "(g moisture)/m^3";
  parameterDictionary["Water Partial Pressure"].unitCombo.value = "kPa";
  parameterDictionary["Water Mole Fraction"].unitCombo.value = "%";
  parameterDictionary["Water Mass Fraction"].unitCombo.value = "%";

  handleCheckBoxes("Pressure");
  performPressureCalculations();
  performHumidityCalculations();
}

document.addEventListener("DOMContentLoaded", function () {
  addHTMLElements();
  parameterDictionary.completeDict();
  // Initialize Webpage:
  initializePage();
});

function handleCheckBoxes(callingItemKey) {
  for (const sectionKey in sectionDict) {
    if (sectionKey !== "Temperature") {
      items = sectionDict[sectionKey];

      for (itemKey of items) {
        let inputbox = parameterDictionary[itemKey].inputBox;
        if (parameterDictionary[itemKey].radioButton.checked) {
          inputbox.removeAttribute("readonly");
          inputbox.style.backgroundColor = "yellow";
        } else {
          inputbox.style.backgroundColor = "lightgrey";
          inputbox.setAttribute("readonly", true);
        }
        inputbox = parameterDictionary[callingItemKey].inputBox;
        inputbox.focus();
        inputbox.select();
      }
    }
  }
}

function addOneElementRow(parentSection, dictKey) {
  const container = document.getElementById(parentSection + "Container");
  // Create the div element with class "input-row"
  const divElement = document.createElement("div");
  divElement.setAttribute("class", "input-row");

  // Create the radio input
  const radioInput = document.createElement("input");
  radioInput.setAttribute("type", "radio");
  radioInput.setAttribute("id", dictKey + "-radio");
  radioInput.setAttribute("name", "alt-" + parentSection);
  radioInput.setAttribute("value", dictKey);

  // Create the label for value
  const label = document.createElement("label");
  label.setAttribute("for", dictKey + "-units");
  label.textContent = dictKey;
  label.style.width = dictKey === "Temperature" ? `${188}px` : `${160}px`;

  // Create the input element for value
  const input = document.createElement("input");
  input.setAttribute("id", dictKey + "-input");
  input.setAttribute("type", "number");
  input.setAttribute("step", "1");
  input.setAttribute("value", "");
  input.style.width = `${100}px`;

  // Create the select element for units
  const select = document.createElement("select");
  select.setAttribute("id", dictKey + "-units");
  select.setAttribute("name", dictKey + "-units");
  select.style.width = `${150}px`;

  const options = parameterDictionary[dictKey].units;

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.setAttribute("value", option.value);
    opt.textContent = option.label;
    select.appendChild(opt);
  });

  // Create the span elements for min and max values
  const minSpan = document.createElement("span");
  minSpan.setAttribute("class", "range-label");
  minSpan.innerHTML = "&nbsp;Min:&nbsp;";
  minSpan.style.backgroundColor = "skyblue";
  const maxSpan = document.createElement("span");
  maxSpan.setAttribute("class", "range-label");
  maxSpan.innerHTML = "&nbsp;Max:&nbsp;";
  maxSpan.style.backgroundColor = "orange";

  // Create the labels for min and max values
  const minLabel = document.createElement("label");
  minLabel.setAttribute("class", "range-" + dictKey + "Min");
  minLabel.setAttribute("id", "range-" + dictKey + "Min");
  minLabel.textContent = parameterDictionary[dictKey].objRange.min;
  minLabel.style.width = `${100}px`;
  minLabel.style.backgroundColor = "skyblue";

  const maxLabel = document.createElement("label");
  maxLabel.setAttribute("class", "range-" + dictKey + "Max");
  maxLabel.setAttribute("id", "range-" + dictKey + "Max");
  maxLabel.textContent = parameterDictionary[dictKey].objRange.max;
  maxLabel.style.width = `${100}px`;
  maxLabel.style.backgroundColor = "orange";

  // Create the label for digits
  const labelDig = document.createElement("label");
  labelDig.setAttribute("class", "digits-label");
  labelDig.setAttribute("for", dictKey + "-digits");
  labelDig.textContent = "Digits:";

  // Create the input element for digits
  const inputDig = document.createElement("input");
  inputDig.setAttribute("id", dictKey + "-digits");
  inputDig.setAttribute("type", "number");
  inputDig.setAttribute("min", "0");
  inputDig.setAttribute("max", "10");
  inputDig.setAttribute("value", "3");

  // Append the elements to the input-row div element
  if (dictKey !== "Temperature") divElement.appendChild(radioInput);
  divElement.appendChild(label);
  divElement.appendChild(select);
  divElement.appendChild(input);
  divElement.appendChild(minSpan);
  divElement.appendChild(minLabel);
  divElement.appendChild(maxSpan);
  divElement.appendChild(maxLabel);
  divElement.appendChild(labelDig);
  divElement.appendChild(inputDig);

  // Append the input-row div element to the container element
  container.appendChild(divElement);
}

function addHTMLElements() {
  for (const sectionKey in sectionDict) {
    sectionDict[sectionKey].forEach(function (element) {
      addOneElementRow(sectionKey, element);
    });
  }
}

function convertPressure(value, fromUnit, toUnit = "Pa") {
  if (typeof value === "string") value = Number(value);
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

function convertTemperature(value, fromUnit, toUnit = "C") {
  if (typeof value === "string") value = Number(value);

  const fromUnitsToCelsius = {
    C: (val) => val,
    K: (val) => val - 273.15,
    F: (val) => (5 / 9) * (val - 32),
    R: (val) => (5 / 9) * val - 273.15,
  };

  const fromCelsiusToUnits = {
    C: (val) => val,
    K: (val) => val + 273.15,
    F: (val) => (9 / 5) * val + 32,
    R: (val) => (9 / 5) * (val + 273.15),
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!fromUnitsToCelsius[fromUnit] || !fromCelsiusToUnits[toUnit]) {
    return null; // invalid unit provided
  }

  // convert input value to Celsius
  const CelsiusValue =
    fromUnit === "C" ? value : fromUnitsToCelsius[fromUnit](value);

  // convert Celsius value to desired output unit
  const result =
    toUnit === "C" ? CelsiusValue : fromCelsiusToUnits[toUnit](CelsiusValue);

  return result;
}

function convertAltitude(value, fromUnit, toUnit = "m") {
  if (typeof value === "string") value = Number(value);
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

function convertPercent(value, fromUnit, toUnit = "-") {
  if (typeof value === "string") value = Number(value);
  const units = {
    "-": 1,
    "%": 0.01,
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!units[fromUnit] || !units[toUnit]) {
    return null; // invalid unit provided
  }

  const mainValue = value * units[fromUnit];
  const result = mainValue / units[toUnit];

  return result;
}

function convertHumidRatio(
  value,
  fromUnit,
  toUnit = "(g moisture)/(kg dry air)"
) {
  if (typeof value === "string") value = Number(value);
  const units = {
    "(g moisture)/(kg dry air)": 1,
    "(kg moisture)/(kg dry air)": 1000,
    "(lb moisture)/(lb dry air)": 1000,
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!units[fromUnit] || !units[toUnit]) {
    return null; // invalid unit provided
  }

  const mainValue = value * units[fromUnit];
  const result = mainValue / units[toUnit];

  return result;
}

function convertAbsHumidity(value, fromUnit, toUnit = "(kg moisture)/m^3") {
  if (typeof value === "string") value = Number(value);
  const units = {
    "(kg moisture)/m^3": 1,
    "(g moisture)/m^3": 0.001,
    "(lb moisture)/ft^3": 16.018463,
  };

  if (fromUnit === toUnit) {
    return value; // no conversion needed
  }

  if (!units[fromUnit] || !units[toUnit]) {
    return null; // invalid unit provided
  }

  const mainValue = value * units[fromUnit];
  const result = mainValue / units[toUnit];

  return result;
}

function calcPressureAltitude(inputValue, itemKey) {
  const P0 = 101325;
  const coeff = 2.25577 * 1e-5;
  const powCoeff = 5.2;

  let pCalc, altCalc;

  switch (itemKey) {
    case "Pressure":
      pCalc = inputValue;
      altCalc = (1 - Math.pow(inputValue / P0, 1 / powCoeff)) / coeff;
      break;
    case "Altitude":
      pCalc = P0 * Math.pow(1 - coeff * inputValue, powCoeff);
      altCalc = inputValue;
      break;
  }

  return { Pressure: pCalc, Altitude: altCalc };
}

function waterSatPressure(temperature) {
  // Input T_in in C, get P_sat in Pa
  // -173.15 K <= T_in <= 473.15 K or -100 C <= T_in <= 200 C

  const T_in = temperature + 273.15; // Convert temperature to Kelvin

  let C = [
    -5674.5359, 6.3925247, -0.009677843, 0.00000062215701, 2.0747825e-9,
    -9.484024e-13, 4.1635019, -5800.2206, 1.3914993, -0.048640239,
    0.000041764768, -0.000000014452093, 6.5459673,
  ];
  let Ln_p_sat;

  if (T_in < 273.15) {
    Ln_p_sat =
      C[0] / T_in +
      C[1] +
      C[2] * T_in +
      C[3] * Math.pow(T_in, 2) +
      C[4] * Math.pow(T_in, 3) +
      C[5] * Math.pow(T_in, 4) +
      C[6] * Math.log(T_in);
  } else {
    Ln_p_sat =
      C[7] / T_in +
      C[8] +
      C[9] * T_in +
      C[10] * Math.pow(T_in, 2) +
      C[11] * Math.pow(T_in, 3) +
      C[12] * Math.log(T_in);
  }

  return Math.exp(Ln_p_sat);
}

function waterSatTemperature(pressure) {
  //pressure: Pa
  // temperature: C

  const itrMax = 1000;
  const errOK = 1e-6;

  let Tmin = -100;
  let Tmax = 200;
  let Tgoal;

  let itr = 0;

  do {
    let p_b = waterSatPressure(Tmin);
    let p_t = waterSatPressure(Tmax);
    Tgoal = 0.5 * (Tmin + Tmax);
    let Pgoal = waterSatPressure(Tgoal);

    let e_b = p_b - pressure;
    let e_g = Pgoal - pressure;

    if (e_g * e_b < 0) {
      Tmax = Tgoal;
    } else {
      Tmin = Tgoal;
    }

    itr++;
  } while (itr < itrMax && Tmax - Tmin > errOK);

  return Tgoal;
}

function performHumidityCalculations() {
  const Pin = parameterDictionary["Pressure"].convertingFunc(
    parameterDictionary["Pressure"].inputBox.value,
    parameterDictionary["Pressure"].unitCombo.value
  );

  const Tin = parameterDictionary["Temperature"].convertingFunc(
    parameterDictionary["Temperature"].inputBox.value,
    parameterDictionary["Temperature"].unitCombo.value
  );

  let inputHumidParam;

  const params = sectionDict["Humidity"];

  for (const param of params) {
    if (parameterDictionary[param].radioButton.checked) {
      inputHumidParam = param;
      break;
    }
  }

  const inputParamVal = parameterDictionary[inputHumidParam].convertingFunc(
    parameterDictionary[inputHumidParam].inputBox.value,
    parameterDictionary[inputHumidParam].unitCombo.value
  );

  const calcResults = calcHumidParams(Tin, Pin, inputHumidParam, inputParamVal);

  for (itemKey of sectionDict["Humidity"]) {
    if (!parameterDictionary[itemKey].radioButton.checked) {
      const dictOutput = parameterDictionary[itemKey];
      const valOutput = calcResults[itemKey];
      dictOutput.inputBox.value = dictOutput
        .convertingFunc(
          valOutput,
          dictOutput.fromUnit,
          dictOutput.unitCombo.value
        )
        .toFixed(dictOutput.inputDigints.value);
    }
  }
}

function calcHumidParams(Tin, Pin, inputHumidParam, inputParamVal) {
  // Calculations:
  const Pg = waterPartPreseRange.max;
  let Pv;
  switch (inputHumidParam) {
    case "Relative Humidity":
      Pv = inputParamVal * Pg;
      break;
    case "Humidity Ratio":
      Pv =
        ((inputParamVal / 1000) * Pin) /
        (inputParamVal / 1000 + MW_water / MW_dryAir);

      break;
    case "Absolute Humidity":
      Pv = (1000 * (inputParamVal * Ru * (Tin + 273.15))) / MW_water;
      break;
    case "Dew Point Temperature":
      Pv = waterSatPressure(inputParamVal);
      break;
    case "Wet Bulb Temperature":
      const humidityRatio = calcHumidityRatioByTwb(inputParamVal, Tin, Pin);
      Pv =
        ((humidityRatio / 1000) * Pin) /
        (humidityRatio / 1000 + MW_water / MW_dryAir);

      break;
    case "Water Partial Pressure":
      Pv = inputParamVal;
      break;
    case "Water Mole Fraction":
      Pv = inputParamVal * Pin;
      break;
    case "Water Mass Fraction":
      const waterMoleFraction =
        (inputParamVal * MW_dryAir) /
        (MW_water + inputParamVal * (MW_dryAir - MW_water));
      Pv = waterMoleFraction * Pin;
      break;
    default:
      console.log("Invalid inputHumidParam value");
      break;
  }
  //----------------------------------------------------------

  const phi = Pv / Pg;
  const omega = (1000 * ((MW_water / MW_dryAir) * Pv)) / (Pin - Pv);
  const AH = (0.001 * (Pv * MW_water)) / (Ru * (Tin + 273.15));
  const Tdp = waterSatTemperature(Pv);
  const Twb = calcTwbByHumidityRatio(omega, Tin, Pin);
  const waterMoleFraction = Pv / Pin;
  const waterMassFraction =
    (waterMoleFraction * MW_water) /
    (MW_dryAir + waterMoleFraction * (MW_water - MW_dryAir));

  return {
    "Relative Humidity": phi,
    "Humidity Ratio": omega,
    "Absolute Humidity": AH,
    "Dew Point Temperature": Tdp,
    "Wet Bulb Temperature": Twb,
    "Water Partial Pressure": Pv,
    "Water Mole Fraction": waterMoleFraction,
    "Water Mass Fraction": waterMassFraction,
  };
}

function calcHumidityRange() {
  const Pin = parameterDictionary["Pressure"].convertingFunc(
    parameterDictionary["Pressure"].inputBox.value,
    parameterDictionary["Pressure"].unitCombo.value
  );

  const Tin = parameterDictionary["Temperature"].convertingFunc(
    parameterDictionary["Temperature"].inputBox.value,
    parameterDictionary["Temperature"].unitCombo.value
  );

  const Pg = waterSatPressure(Tin);
  const absHumidMax = (0.001 * (Pg * MW_water)) / (Ru * (Tin + 273.15));
  const HumidRatioMax = 1000 * (MW_water / MW_dryAir) * (Pg / (Pin - Pg));
  const moleFracH2OMax = Pg / Pin;
  const MW_satAir =
    moleFracH2OMax * MW_water + (1 - moleFracH2OMax) * MW_dryAir;
  const massFracH2oMax = (moleFracH2OMax * MW_water) / MW_satAir;

  const TwbMin = calcTwbByHumidityRatio(0, Tin, Pin);

  return {
    Tin: Tin,
    TwbMin: TwbMin,
    Pg: Pg,
    absHumidMax: absHumidMax,
    HumidRatioMax: HumidRatioMax,
    moleFracH2OMax: moleFracH2OMax,
    massFracH2oMax: massFracH2oMax,
  };
}

function calcHumidityRatioByTwb(Twb, Tdb, Pamb) {
  const Pg = waterSatPressure(Twb);
  const HumidRatioSat = (MW_water / MW_dryAir) * (Pg / (Pamb - Pg));

  let HumidityRatio =
    (HumidRatioSat * (2501 - 2.381 * Twb) - 1.006 * (Tdb - Twb)) /
    (2501 + 1.805 * Tdb - 4.186 * Twb);

  return 1000 * HumidityRatio;
}

function calcTwbByHumidityRatio(omega, Tdb, Pamb) {
  const itrMax = 1000;
  const errOK = 1e-6;

  let Tmin = -100;
  let Tmax = Tdb;
  let Tgoal;

  let itr = 0;

  do {
    let w_b = calcHumidityRatioByTwb(Tmin, Tdb, Pamb);
    Tgoal = 0.5 * (Tmin + Tmax);
    let w_g = calcHumidityRatioByTwb(Tgoal, Tdb, Pamb);

    let e_b = w_b - omega;
    let e_g = w_g - omega;

    if (e_g * e_b < 0) {
      Tmax = Tgoal;
    } else {
      Tmin = Tgoal;
    }

    itr++;
  } while (itr < itrMax && Tmax - Tmin > errOK);

  return Tgoal;
}
