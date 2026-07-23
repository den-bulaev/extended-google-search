import { RefObject, useEffect, useRef, useState } from "react";

import Select, { SelectInstance } from "react-select";
import { Tooltip } from "react-tooltip";

import { LocationModal } from "./components/LocationModal/LocationModal";
import { PresetsModal } from "./components/PresetsModal/PresetsModal";
import { CrossSmall } from "./components/Icons/CrossSmall";

import {
  BackgroundActions,
  crOptions,
  defaultSelectOptions,
  EInputNames,
  ESelectNames,
  getSearchURL,
  getUULEString,
  glOptions,
  hlOptions,
  IParamsFormData,
  ISelectOption,
  ITile,
  labelTexts,
  lrOptions,
  removeInputMark,
  selectStyles,
  tbsOptions,
  udmOptions,
} from "./utils";

import icon48 from "./assets/icon48.png";

function App() {
  const [tiles, setTiles] = useState<ITile[]>([]);
  const [isSearch, setIsSearch] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFormRef = useRef<HTMLFormElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const tbsRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const lrRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const hlRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const udmRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const glRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const crRef = useRef<SelectInstance<ISelectOption> | null>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const numRef = useRef<HTMLInputElement>(null);
  const eqRef = useRef<HTMLInputElement>(null);
  const epqRef = useRef<HTMLInputElement>(null);
  const filetypeRef = useRef<HTMLInputElement>(null);
  const siteSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: BackgroundActions.getStorage },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
        } else {
          if (response.data?.length) {
            response.data.forEach((item: ITile) => {
              formPreFill(item);
            });
            setTiles(response.data);
          }
        }
      },
    );
  }, []);

  const formPreFill = (tile: ITile) => {
    switch (tile.key) {
      case ESelectNames.CR:
        crRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
        );
        break;

      case ESelectNames.HL:
        hlRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
        );
        break;

      case ESelectNames.LR:
        lrRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
        );
        break;

      case ESelectNames.UDM:
        udmRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
        );
        break;

      case ESelectNames.GL:
        glRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
        );
        break;

      case ESelectNames.TBS:
        tbsRef.current?.setValue(
          { label: tile.selectLabel || "", value: tile.rawValue },
          "select-option",
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
    setIsDirty(false);
  };

  const getSelectLabel = (key: keyof IParamsFormData) => {
    switch (key) {
      case ESelectNames.CR:
        return crRef.current?.getValue()[0].label;

      case ESelectNames.HL:
        return hlRef.current?.getValue()[0].label;

      case ESelectNames.UDM:
        return udmRef.current?.getValue()[0].label;

      case ESelectNames.GL:
        return glRef.current?.getValue()[0].label;

      case ESelectNames.LR:
        return lrRef.current?.getValue()[0].label;

      default:
        return tbsRef.current?.getValue()[0].label;
    }
  };

  const handleClickReset = () => {
    formRef.current?.reset();
    hlRef.current?.setValue(defaultSelectOptions.hl, "select-option");
    udmRef.current?.setValue(defaultSelectOptions.udm, "select-option");
    glRef.current?.setValue(defaultSelectOptions.gl, "select-option");
    crRef.current?.setValue(defaultSelectOptions.cr, "select-option");
    lrRef.current?.setValue(defaultSelectOptions.lr, "select-option");
    tbsRef.current?.setValue(defaultSelectOptions.tbs, "select-option");

    setTiles([]);
  };

  const handleInput = (
    refObj: React.RefObject<HTMLInputElement | null>,
    isPerPage?: boolean,
  ) => {
    const count = isPerPage ? 10 : 100;

    if (refObj.current) {
      refObj.current.value = refObj.current.value.replace(/\D/g, "");
      refObj.current.value =
        +refObj.current.value > count ? String(count) : refObj.current.value;
    }
  };

  const handleClickRemoveTile = (key: keyof IParamsFormData) => {
    setTiles((prev) => prev.filter((item) => item.key !== key));

    const targetRef = defineRef(key);

    if (targetRef?.current) {
      removeInputMark(targetRef);
    }

    if (Object.values(ESelectNames).includes(key as ESelectNames)) {
      switch (key) {
        case ESelectNames.HL:
          hlRef.current?.setValue(defaultSelectOptions.hl, "select-option");
          break;

        case ESelectNames.UDM:
          udmRef.current?.setValue(defaultSelectOptions.udm, "select-option");
          break;

        case ESelectNames.GL:
          glRef.current?.setValue(defaultSelectOptions.gl, "select-option");
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

  const updateLocation = (location: string) => {
    const input = formRef.current?.elements.namedItem(
      "uule",
    ) as HTMLInputElement | null;

    if (input) {
      input.value = getUULEString(location);
    }

    setIsDirty(true);
  };

  const handleClickSearch = () => {
    setIsSearch((prev) => {
      if (searchFormRef.current && titleRef.current) {
        if (prev) {
          titleRef.current.classList.remove("element-hidden");
          searchFormRef.current.classList.add("element-hidden");
        } else {
          searchFormRef.current.classList.remove("element-hidden");
          titleRef.current.classList.add("element-hidden");

          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }
      }

      return !prev;
    });

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      isSearch &&
      searchInputRef.current &&
      searchInputRef.current.value.trim()
    ) {
      chrome.tabs.create({
        url: getSearchURL(searchInputRef.current.value, tiles),
      });
    }
  };

  const defineRef = (key: keyof IParamsFormData) => {
    switch (key) {
      case ESelectNames.CR:
        return crRef;

      case ESelectNames.TBS:
        return tbsRef;

      case ESelectNames.HL:
        return hlRef;

      case ESelectNames.LR:
        return lrRef;

      case ESelectNames.UDM:
        return udmRef;

      case ESelectNames.GL:
        return glRef;

      case EInputNames.AS_EPQ:
        return epqRef;

      case EInputNames.AS_EQ:
        return eqRef;

      case EInputNames.AS_FILETYPE:
        return filetypeRef;

      case EInputNames.AS_SITESEARCH:
        return siteSearchRef;

      case EInputNames.NUM:
        return numRef;

      case EInputNames.START:
        return startRef;

      default:
        return null;
    }
  };

  const handleTileFocus = (key: keyof IParamsFormData, isBlur?: boolean) => {
    const targetRef: RefObject<
      HTMLInputElement | SelectInstance<ISelectOption> | null
    > | null = defineRef(key);

    if (!targetRef?.current) {
      return;
    }

    if (isBlur) {
      removeInputMark(targetRef);
      return;
    }

    const targetDomElement =
      targetRef.current instanceof HTMLInputElement
        ? targetRef.current
        : targetRef.current.controlRef;

    if (targetDomElement) {
      const containerDOM = targetDomElement.closest(".wrapper-mark");

      if (containerDOM) {
        containerDOM.classList.add("input-mark");
      }
    }
  };

  const onTileFocus = (key: keyof IParamsFormData) => {
    handleTileFocus(key);
  };

  const onTileBlur = (key: keyof IParamsFormData) => {
    handleTileFocus(key, true);
  };

  const applyPresets = (params: ITile[]) => {
    params.forEach((param) => {
      formPreFill(param);
    });

    setIsDirty(true);
  };

  return (
    <div className="wrapper">
      <header className="header">
        <form
          ref={searchFormRef}
          className="main-search-form element-hidden"
          onSubmit={handleSearchSubmit}
        >
          <input
            ref={searchInputRef}
            className="main-search-input input-prime"
            type="search"
            name="mainSearch"
            placeholder={chrome.i18n.getMessage("searchPlaceholder")}
            {...{ spellCheck: "false" }}
          />
        </form>
        <h2 ref={titleRef} className="title">
          {chrome.i18n.getMessage("appName")}
        </h2>

        <button className="search-btn" onClick={handleClickSearch}>
          <img src={icon48} alt="logo" />
        </button>
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
                "startLabel",
              )}:`}</span>
              <input
                ref={startRef}
                className="text-input wrapper-mark"
                name="start"
                type="text"
                maxLength={3}
                onInput={() => handleInput(startRef)}
                placeholder={chrome.i18n.getMessage("startPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_epqLabel",
              )}:`}</span>
              <input
                ref={epqRef}
                className="text-input wrapper-mark"
                name="as_epq"
                type="text"
                placeholder={chrome.i18n.getMessage("as_epqPlaceholder")}
              />
            </label>

            <label className="element-hidden">
              <input type="text" name="uule" className="text-input" />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_filetypeLabel",
              )}:`}</span>
              <input
                ref={filetypeRef}
                className="text-input wrapper-mark"
                name="as_filetype"
                type="text"
                placeholder={chrome.i18n.getMessage("as_filetypePlaceholder")}
              />
            </label>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.LR}
                ref={lrRef}
                defaultValue={defaultSelectOptions.lr}
                options={lrOptions}
                styles={selectStyles}
              />
            </div>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.HL}
                ref={hlRef}
                defaultValue={defaultSelectOptions.hl}
                options={hlOptions}
                styles={selectStyles}
              />
            </div>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.UDM}
                ref={udmRef}
                defaultValue={defaultSelectOptions.udm}
                options={udmOptions}
                styles={selectStyles}
              />
            </div>
          </div>

          <div className="form-section">
            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "numLabel",
              )}:`}</span>
              <input
                ref={numRef}
                className="text-input wrapper-mark"
                name="num"
                type="text"
                maxLength={2}
                onInput={() => handleInput(numRef, true)}
                placeholder={chrome.i18n.getMessage("numPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_sitesearchLabel",
              )}:`}</span>
              <input
                ref={siteSearchRef}
                className="text-input wrapper-mark"
                name="as_sitesearch"
                type="text"
                placeholder={chrome.i18n.getMessage("as_sitesearchPlaceholder")}
              />
            </label>

            <label className="input-wrapper">
              <span className="label-text">{`${chrome.i18n.getMessage(
                "as_eqLabel",
              )}:`}</span>
              <input
                ref={eqRef}
                className="text-input wrapper-mark"
                name="as_eq"
                type="text"
                placeholder={chrome.i18n.getMessage("as_eqPlaceholder")}
              />
            </label>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.CR}
                ref={crRef}
                defaultValue={defaultSelectOptions.cr}
                options={crOptions}
                styles={selectStyles}
              />
            </div>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.TBS}
                ref={tbsRef}
                defaultValue={defaultSelectOptions.tbs}
                options={tbsOptions}
                styles={selectStyles}
              />
            </div>

            <div className="wrapper-mark">
              <Select
                name={ESelectNames.GL}
                ref={glRef}
                defaultValue={defaultSelectOptions.gl}
                options={glOptions}
                styles={selectStyles}
              />
            </div>
          </div>
        </form>
      </div>

      <div className="tiles-wrapper">
        <div className="tiles-container">
          {tiles.map((tile) => {
            if (!tile.value) {
              return null;
            }

            return (
              <div
                className="tile"
                key={tile.value}
                data-tooltip-id="tile-tooltip"
                data-tooltip-content={tile.value}
                onMouseEnter={() => onTileFocus(tile.key)}
                onMouseLeave={() => onTileBlur(tile.key)}
              >
                <button
                  onClick={() => handleClickRemoveTile(tile.key)}
                  className="icon-btn bucket-btn"
                >
                  <CrossSmall />
                </button>

                {tile.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="btn-block">
        <div className="btn-group gap-10">
          <LocationModal updateLocation={updateLocation} />
          <PresetsModal
            tiles={tiles}
            searchQuery={searchInputRef}
            applyPresets={applyPresets}
            handleClickSearch={handleClickSearch}
          />
        </div>

        <div className="btn-group">
          <button className="btn background-purple" onClick={handleClickReset}>
            {chrome.i18n.getMessage("resetBtn")}
          </button>

          <button
            className={`btn background-orange${isDirty ? " need-apply" : ""}`}
            type="submit"
            form="paramsForm"
          >
            {chrome.i18n.getMessage("applyBtn")}
          </button>
        </div>
      </div>

      <Tooltip id="tile-tooltip" place="bottom" openOnClick={true} />
      <Tooltip
        id="preset-btn-tooltip"
        place="top"
        render={() => <p>{chrome.i18n.getMessage("presetsTooltipBulk")}</p>}
      />
    </div>
  );
}

export default App;
