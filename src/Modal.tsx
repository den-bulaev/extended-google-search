import {
  Dispatch,
  MouseEvent,
  MouseEventHandler,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { Tooltip } from "react-tooltip";

import { BackgroundActions } from "./utils";

import icon from "./assets/cross.svg";

type TModal = {
  updateLocation: (val: string) => void;
  selectedLocationId: string;
  setSelectedLocationId: Dispatch<SetStateAction<string>>;
  handleClose: () => void;
};

type TSearchData = {
  id: string;
  value: string;
};

export function Modal(props: TModal) {
  const {
    updateLocation,
    selectedLocationId,
    setSelectedLocationId,
    handleClose,
  } = props;

  const [searchData, setSearchData] = useState<TSearchData[] | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
      searchRef.current?.focus();
    }
  }, []);

  const handleClickOutDialog: MouseEventHandler<HTMLDialogElement> = (
    e: MouseEvent,
  ) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    handleClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchRef.current?.value) {
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: BackgroundActions.searchGeo,
        queryList: searchRef.current.value.split(/\s+/),
      },
      (response) => {
        if (response && response.success) {
          setSearchData(response.data.length ? response.data : null);
        } else {
          console.error("Search error:", response?.error);
        }
      },
    );
  };

  const handleListClick = (e: MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement;

    if (target?.innerText) {
      updateLocation(target.innerText);
    }
  };

  return (
    <dialog ref={dialogRef} onClick={handleClickOutDialog}>
      <button onClick={handleCloseModal} className="icon-btn">
        <img src={icon} alt="delete param" className="big-image" />
      </button>

      <section className="modal-content">
        <h2 className="header-with-tooltip">
          {chrome.i18n.getMessage("changeLocation")}
          <a className="my-anchor-element">?</a>
        </h2>

        <form onSubmit={handleSubmit} className="search-form">
          <input
            ref={searchRef}
            type="search"
            name="locationSearch"
            {...{ spellCheck: "false" }}
          />
          <button type="submit">{chrome.i18n.getMessage("searchBtn")}</button>
        </form>

        <aside className="to-many-results-tip">
          <p className="useful-tip">
            {`${searchData?.length || 0} ${chrome.i18n.getMessage("matches")}${searchData && searchData.length > 100 ? chrome.i18n.getMessage("provideSpecificQuery") : ""}`}
          </p>
        </aside>

        <div className="list-wrapper">
          <ul className="location-list" onClick={handleListClick}>
            {(searchData && searchData.length <= 100 ? searchData : []).map(
              (location) => {
                return (
                  <li
                    key={location.id}
                    className={`location-list_item${selectedLocationId === location.id ? " background-green" : ""}`}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    {location.value}
                  </li>
                );
              },
            )}
          </ul>
        </div>
      </section>

      <Tooltip anchorSelect=".my-anchor-element" place="bottom">
        <p>{chrome.i18n.getMessage("locationCountryTip")}</p>
        <p>{chrome.i18n.getMessage("whitespaceTip")}</p>
      </Tooltip>
    </dialog>
  );
}
