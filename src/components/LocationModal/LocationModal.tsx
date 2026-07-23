import { MouseEvent, useEffect, useRef, useState } from "react";
import { BaseModal } from "../BaseModal/BaseModal";
import { BackgroundActions } from "../../utils";

type TSearchData = {
  id: string;
  value: string;
};

type LocationModalProps = {
  updateLocation: (val: string) => void;
};

export function LocationModal(props: LocationModalProps) {
  const { updateLocation } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchData, setSearchData] = useState<TSearchData[] | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }

    setSearchData(null);
  }, [isModalOpen]);

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
    <>
      <button
        className="btn background-orange"
        onClick={() => setIsModalOpen(true)}
      >
        {chrome.i18n.getMessage("changeLocationBtn")}
      </button>

      {isModalOpen && (
        <BaseModal
          title={chrome.i18n.getMessage("changeLocation")}
          tooltipTexts={[
            chrome.i18n.getMessage("locationCountryTip"),
            chrome.i18n.getMessage("whitespaceTip"),
          ]}
          handleClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="search-form">
            <input
              ref={searchRef}
              className="input-prime"
              type="search"
              name="locationSearch"
              placeholder={chrome.i18n.getMessage("enterLocation")}
              {...{ spellCheck: "false" }}
            />
            <button type="submit">{chrome.i18n.getMessage("searchBtn")}</button>
          </form>

          <aside className="tip-left">
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
                      className={`list-item${selectedLocationId === location.id ? " background-light-purple" : ""}`}
                      onClick={() => setSelectedLocationId(location.id)}
                    >
                      {location.value}
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        </BaseModal>
      )}
    </>
  );
}
