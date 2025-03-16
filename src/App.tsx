import { useEffect, useRef, useState } from "react";

import Select, { SelectInstance } from "react-select";
import { Tooltip } from "react-tooltip";

import {
  BackgroundActions,
  crOptions,
  defaultSelectOptions,
  ESelectNames,
  hlOptions,
  IParamsFormData,
  ISelectOption,
  ITile,
  labelTexts,
  lrOptions,
  tbsOptions,
} from "./utils";

import icon from "./assets/cross.svg";
import icon48 from "./assets/icon48.png";

function App() {
  const [tiles, setTiles] = useState<ITile[]>([]);

  const formRef = useRef<HTMLFormElement | null>(null);
  const tbsRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const lrRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const hlRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const crRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const numRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: BackgroundActions.getStorage },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
        } else {
          response.data.forEach((item: ITile) => {
            formPreFill(item);
          });
          setTiles(response.data);
        }
      }
    );
  }, []);

  const formPreFill = (tile: ITile) => {
    switch (tile.key) {
      case ESelectNames.CR:
        crRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option"
        );
        break;

      case ESelectNames.HL:
        hlRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option"
        );
        break;

      case ESelectNames.LR:
        lrRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option"
        );
        break;

      case ESelectNames.TBS:
        tbsRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option"
        );
        break;

      default:
        (formRef.current?.elements.namedItem(tile.key) as RadioNodeList).value =
          tile.rawValue;
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const rawTiles: ITile[] = [];
    const formData: FormData = new FormData(e.currentTarget);
    // ATTENTION!!! IMPORTANT EXAMPLE OF OVERRIDING FORMDATA TYPE!
    const formDataIterator: FormDataIterator<
      [IParamsFormData | string, FormDataEntryValue]
    > = formData.entries();
    const data: IParamsFormData = Object.fromEntries(formDataIterator);

    const keys = Object.keys(data) as (keyof IParamsFormData)[];

    keys.forEach((key) => {
      if (data[key]) {
        const preparedParam = `&${key}=${data[key]}`;
        rawTiles.push({
          label: labelTexts[key],
          value: preparedParam,
          rawValue: data[key],
          selectLabel: Object.values(ESelectNames).includes(key as ESelectNames)
            ? getSelectLabel(key)
            : undefined,
          key,
        });
      }
    });

    chrome.runtime.sendMessage({
      action: BackgroundActions.setStorage,
      state: rawTiles,
    });

    setTiles(rawTiles);
  };

  const getSelectLabel = (key: keyof IParamsFormData) => {
    switch (key) {
      case ESelectNames.CR:
        return crRef.current?.getValue()[0].label;

      case ESelectNames.HL:
        return hlRef.current?.getValue()[0].label;

      case ESelectNames.LR:
        return lrRef.current?.getValue()[0].label;

      default:
        return tbsRef.current?.getValue()[0].label;
    }
  };

  const handleClickReset = () => {
    formRef.current?.reset();
    hlRef.current?.setValue(defaultSelectOptions.hl, "select-option");
    crRef.current?.setValue(defaultSelectOptions.cr, "select-option");
    lrRef.current?.setValue(defaultSelectOptions.lr, "select-option");
    tbsRef.current?.setValue(defaultSelectOptions.tbs, "select-option");

    setTiles([]);
  };

  const handleInput = (refObj: React.RefObject<HTMLInputElement | null>) => {
    if (refObj.current) {
      refObj.current.value = refObj.current.value.replace(/\D/g, "");
      refObj.current.value =
        +refObj.current.value > 100 ? "100" : refObj.current.value;
    }
  };

  const handleClickRemoveTile = (key: string) => {
    setTiles((prev) => prev.filter((item) => item.key !== key));

    if (Object.values(ESelectNames).includes(key as ESelectNames)) {
      switch (key) {
        case ESelectNames.HL:
          hlRef.current?.setValue(defaultSelectOptions.hl, "select-option");
          break;

        case ESelectNames.CR:
          crRef.current?.setValue(defaultSelectOptions.cr, "select-option");
          break;

        case ESelectNames.LR:
          lrRef.current?.setValue(defaultSelectOptions.lr, "select-option");
          break;

        default:
          tbsRef.current?.setValue(defaultSelectOptions.tbs, "select-option");
      }

      return;
    }

    (formRef.current?.elements.namedItem(key) as RadioNodeList).value = "";
  };

  return (
    <div className="wrapper">
      <header className="header">
        <h2 className="title">{chrome.i18n.getMessage("appName")}</h2>
        <img className="logo" src={icon48} alt="logo" />
      </header>

      <div className="form-wrapper">
        <form
          id="paramsForm"
          ref={formRef}
          className="params-form"
          onSubmit={handleFormSubmit}
        >
          <div className="form-section">
            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "startLabel"
              )}:`}</span>
              <input
                ref={startRef}
                name="start"
                type="text"
                maxLength={3}
                onInput={() => handleInput(startRef)}
                placeholder={chrome.i18n.getMessage("startPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_epqLabel"
              )}:`}</span>
              <input
                name="as_epq"
                type="text"
                placeholder={chrome.i18n.getMessage("as_epqPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_filetypeLabel"
              )}:`}</span>
              <input
                name="as_filetype"
                type="text"
                placeholder={chrome.i18n.getMessage("as_filetypePlaceholder")}
              />
            </label>

            <Select
              name={ESelectNames.LR}
              ref={lrRef}
              defaultValue={defaultSelectOptions.lr}
              options={lrOptions}
            />

            <Select
              name={ESelectNames.HL}
              ref={hlRef}
              defaultValue={defaultSelectOptions.hl}
              options={hlOptions}
            />
          </div>

          <div className="form-section">
            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "numLabel"
              )}:`}</span>
              <input
                ref={numRef}
                name="num"
                type="text"
                maxLength={3}
                onInput={() => handleInput(numRef)}
                placeholder={chrome.i18n.getMessage("numPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_sitesearchLabel"
              )}:`}</span>
              <input
                name="as_sitesearch"
                type="text"
                placeholder={chrome.i18n.getMessage("as_sitesearchPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_eqLabel"
              )}:`}</span>
              <input
                name="as_eq"
                type="text"
                placeholder={chrome.i18n.getMessage("as_eqPlaceholder")}
              />
            </label>

            <Select
              name={ESelectNames.CR}
              ref={crRef}
              defaultValue={defaultSelectOptions.cr}
              options={crOptions}
            />

            <Select
              name={ESelectNames.TBS}
              ref={tbsRef}
              defaultValue={defaultSelectOptions.tbs}
              options={tbsOptions}
            />
          </div>
        </form>
      </div>
      <div className="tiles-wrapper">
        <div className="tiles-container">
          {tiles.map((tile, i) => {
            if (!tile.value) {
              return null;
            }

            return (
              <div
                className="tile"
                key={i + 1}
                data-tooltip-id="tile-tooltip"
                data-tooltip-content={tile.value}
              >
                <button
                  onClick={() => handleClickRemoveTile(tile.key)}
                  className="icon-btn"
                >
                  <img src={icon} alt="delete param" />
                </button>

                {tile.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="btn-block">
        <button className="btn reset-btn" onClick={handleClickReset}>
          {chrome.i18n.getMessage("resetBtn")}
        </button>

        <button className="btn submit-btn" type="submit" form="paramsForm">
          {chrome.i18n.getMessage("applyBtn")}
        </button>
      </div>
      <Tooltip id="tile-tooltip" />
    </div>
  );
}

export default App;
