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
      { value: "(g moisture)/m^3", label: "(kg moisture)/m^3" },
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
          if (key === "Pressure" || key === "Altitude") {
            performCalculations();
          }
        });

        this[key].inputBox.addEventListener("input", function () {
          const isValid = performInputValidation(this);
          if (key === "Pressure" || key === "Altitude") {
            if (isValid) performCalculations();
          }
        });

        this[key].unitCombo.addEventListener("change", function () {
          updateRanges();
          const isValid = performInputValidation(this);
          if (key === "Pressure" || key === "Altitude") {
            if (isValid) performCalculations();
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

function performCalculations() {
  const Pin = parameterDictionary["Pressure"].convertingFunc(
    parameterDictionary["Pressure"].inputBox.value,
    parameterDictionary["Pressure"].unitCombo.value
  );

  const Tin = parameterDictionary["Temperature"].convertingFunc(
    parameterDictionary["Temperature"].inputBox.value,
    parameterDictionary["Temperature"].unitCombo.value
  );

  const rangeHumid = humidityRanges(Pin, Tin);

  updateRanges();

  humidRatioRange.max = rangeHumid[HumidRatioMax];
  absHumidRange.max = rangeHumid[absHumidMax];
  moleFracRange.max = rangeHumid[moleFracH2OMax];
  massFracRange.max = rangeHumid[massFracH2oMax];
  waterPartPreseRange.max = rangeHumid[Pg];

  for (const sectionKey in sectionDict) {
    if (sectionKey !== "Temperature") {
      let calcResults;
      for (itemKey of sectionDict[sectionKey]) {
        if (parameterDictionary[itemKey].radioButton.checked) {
          const dictInput = parameterDictionary[itemKey];
          const inputValue = dictInput.convertingFunc(
            dictInput.inputBox.value,
            dictInput.unitCombo.value
          );
          calcResults = thermodynamicCalculations(
            inputValue,
            itemKey,
            sectionKey
          );
          break;
        }
      }

      for (itemKey of sectionDict[sectionKey]) {
        if (
          sectionKey === "PRessure" &&
          !parameterDictionary[itemKey].radioButton.checked
        ) {
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
  }
}

function initializePage() {
  parameterDictionary["Temperature"].inputBox.value = "25";

  parameterDictionary["Pressure"].radioButton.checked = true;
  parameterDictionary["Pressure"].inputBox.value = "101325";

  parameterDictionary["Dew Point Temperature"].radioButton.checked = true;
  parameterDictionary["Dew Point Temperature"].inputBox.value = "10";

  handleCheckBoxes("Pressure");
  performCalculations();
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
          inputbox.style.backgroundColor = "skyblue";
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

  // Create the label for barometric pressure
  const label = document.createElement("label");
  label.setAttribute("for", dictKey + "-units");
  label.textContent = dictKey + ":";

  // Create the input element for pressure
  const input = document.createElement("input");
  input.setAttribute("id", dictKey + "-input");
  input.setAttribute("type", "number");
  input.setAttribute("step", "1");
  input.setAttribute("value", "");

  // Create the select element for units
  const select = document.createElement("select");
  select.setAttribute("id", dictKey + "-units");
  select.setAttribute("name", dictKey + "-units");

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
  const maxSpan = document.createElement("span");
  maxSpan.setAttribute("class", "range-label");
  maxSpan.innerHTML = "&nbsp;Max:&nbsp;";

  // Create the labels for min and max pressure
  const minLabel = document.createElement("label");
  minLabel.setAttribute("class", "range-" + dictKey + "Min");
  minLabel.setAttribute("id", "range-" + dictKey + "Min");
  minLabel.textContent = parameterDictionary[dictKey].objRange.min;
  const maxLabel = document.createElement("label");
  maxLabel.setAttribute("class", "range-" + dictKey + "Max");
  maxLabel.setAttribute("id", "range-" + dictKey + "Max");
  maxLabel.textContent = parameterDictionary[dictKey].objRange.max;

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
  divElement.appendChild(input);
  divElement.appendChild(select);
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

function thermodynamicCalculations(inputValue, itemKey, sectionKey) {
  switch (sectionKey) {
    case "Pressure":
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
    case "Humidity":
      const dictTemp = parameterDictionary["Temperature"];
      const dictPressure = parameterDictionary["Pressure"];
      const Tin = dictTemp.convertingFunc(
        dictTemp.inputBox.value,
        dictTemp.unitCombo.value
      );
      const Pin = dictPressure.convertingFunc(
        dictPressure.inputBox.value,
        dictPressure.unitCombo.value
      );

      let relHumid,
        absHumid,
        absHumidMax,
        HumidRatio,
        HumidRatioMax,
        Tdp,
        Twb,
        TwbMin,
        Pv,
        Pg,
        moleFracH2O,
        moleFracH2OMax,
        massFracH2o,
        massFracH2oMax,
        MW_satAir;

      Pg = waterSatPressure(Tin);
      absHumidMax = (Pg * MW_water) / (Ru * (Tin + 273.15));
      HumidRatioMax = (MW_water / MW_dryAir) * (Pg / (Pin - Pg));
      moleFracH2OMax = Pg / Pin;
      MW_satAir = moleFracH2OMax * MW_water + (1 - moleFracH2OMax) * MW_dryAir;
      massFracH2oMax = (moleFracH2OMax * MW_water) / MW_satAir;

      switch (itemKey) {
        case "Relative Humidity":
          relHumid = inputValue;
          Pv = relHumid * Pg;
          break;
        case "Absolute Humidity":
          absHumid = inputValue;
          Pv = (absHumid * Ru * (Tin + 273.15)) / MW_water;
          break;
        case "Humidity Ratio":
          HumidRatio = inputValue;
          Pv =
            (MW_dryAir + MW_water * HumidRatio * Pin) /
            (MW_water + MW_dryAir * HumidRatio);
          break;
        case "Dew Point Temperature":
          Tdp = inputValue;
          Pv = waterSatPressure(Tdp);
          break;
        case "Wet Bulb Temperature":
          Twb = inputValue;
          break;
        case "Water Partial Pressure":
          Pv = inputValue;
          break;
        case "Water Mole Fraction":
          moleFracH2O = inputValue;
          Pv = Pin * moleFracH2O;
          break;
        case "Water Mass Fraction":
          massFracH2o = inputValue;
          moleFracH2O =
            (MW_dryAir * massFracH2o) /
            (MW_water + massFracH2o * (MW_dryAir - MW_water));
          Pv = Pin * moleFracH2O;
          break;
      }
  }
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
    let Pgoal = waterSatTemperature(Tgoal);

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

function humidityRanges(Pin, Tin) {
  Pg = waterSatPressure(Tin);
  absHumidMax = (Pg * MW_water) / (Ru * (Tin + 273.15));
  HumidRatioMax = (MW_water / MW_dryAir) * (Pg / (Pin - Pg));
  moleFracH2OMax = Pg / Pin;
  MW_satAir = moleFracH2OMax * MW_water + (1 - moleFracH2OMax) * MW_dryAir;
  massFracH2oMax = (moleFracH2OMax * MW_water) / MW_satAir;
  return {
    Pg: Pg,
    absHumidMax: absHumidMax,
    HumidRatioMax: HumidRatioMax,
    moleFracH2OMax: moleFracH2OMax,
    massFracH2oMax: massFracH2oMax,
  };
}

function calcHumidityRatioByTwb(Twb, Tdb, Pamb) {
  const Pg = waterSatPressure(Twb);
  HumidityRatioSat = (MW_water / MW_dryAir) * Pg * (Pamb - Pg);
  return (
    (HumidityRatioSat * (2501 - 2.381 * Twb) - 1.006 * (Tdb - Twb)) /
    (2501 + 1.805 * Tdb - 4.186 * Twb)
  );
}
