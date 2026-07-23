import {
  MouseEvent,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { v4 as uuidv4 } from "uuid";

import { BaseModal } from "../BaseModal/BaseModal";
import { BackgroundActions, getSearchURL, ITile } from "../../utils";

import { TrashIcon } from "../Icons/TrashIcon";

interface IPreset {
  key: string;
  params: ITile[];
}

type TPresetsModalProps = {
  tiles: ITile[];
  searchQuery: RefObject<HTMLInputElement | null>;
  applyPresets: (tiles: ITile[]) => void;
  handleClickSearch: () => void;
};

export function PresetsModal(props: TPresetsModalProps) {
  const { tiles, searchQuery, applyPresets, handleClickSearch } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presets, setPresets] = useState<IPreset[]>([]);
  const [errorKey, setErrorKey] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<IPreset | null>(null);

  const presetNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: BackgroundActions.getPresets },
      (response: { data: IPreset[] }) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
        } else {
          if (response.data?.length) {
            setPresets(response.data);
          }
        }
      },
    );

    setErrorKey("");
  }, []);

  useEffect(() => {
    if (presetNameRef.current && isModalOpen) {
      presetNameRef.current.focus();
    }
  }, [isModalOpen]);

  const tipText = useMemo(() => {
    return `${presets.length} ${presets.length === 1 ? chrome.i18n.getMessage("presetsTipCounter") : chrome.i18n.getMessage("presetsTipCounterMultiple")} ${errorKey ? `| ${chrome.i18n.getMessage(errorKey)}` : ""}`;
  }, [presets, errorKey]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!presetNameRef.current?.value) {
      return;
    }

    const presetName = presetNameRef.current.value.trim();

    if (presetName) {
      chrome.runtime.sendMessage(
        {
          action: BackgroundActions.addPreset,
          state: { key: presetName, params: tiles },
        },
        (response) => {
          if (!response.success) {
            setErrorKey(response.message);
          } else {
            setPresets((prev) => {
              const newPreset: IPreset = { key: presetName, params: tiles };
              return [...prev, newPreset];
            });
          }
        },
      );
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorKey("");
    setSelectedPreset(null);
  };

  const handleClickPreset = (
    e: MouseEvent<HTMLLIElement>,
    chosenPreset: IPreset,
  ) => {
    e.stopPropagation();
    applyPresets(chosenPreset.params);
    setSelectedPreset(chosenPreset);
  };

  const bulkUpload = () => {
    if (!searchQuery.current?.value) {
      handleClickSearch();
      return;
    }

    presets.forEach((preset) => {
      chrome.tabs.create({
        url: getSearchURL(searchQuery.current!.value, preset.params),
      });
    });
  };

  const deletePreset = (
    e: MouseEvent<HTMLButtonElement>,
    presetName: string,
  ) => {
    e.stopPropagation();

    chrome.runtime.sendMessage(
      {
        action: BackgroundActions.deletePreset,
        state: { key: presetName },
      },
      (response: { data: IPreset[]; success: boolean; message?: string }) => {
        if (!response.success && response.message) {
          console.error(chrome.i18n.getMessage("presetsTipCounterMultiple"));
        } else {
          if (response.data) {
            setPresets(response.data);
            setErrorKey("");
          }
        }
      },
    );
  };

  return (
    <>
      <button
        className="btn background-orange"
        onClick={() => setIsModalOpen(true)}
        data-tooltip-id="preset-btn-tooltip"
        onAuxClick={(e) => {
          if (e.button === 1) {
            bulkUpload();
          }
        }}
      >
        {chrome.i18n.getMessage("presetsBtn")}
      </button>

      {isModalOpen && (
        <BaseModal
          title={chrome.i18n.getMessage("presetsTitle")}
          tooltipTexts={[chrome.i18n.getMessage("presetsTooltip")]}
          handleClose={handleCloseModal}
        >
          <form onSubmit={handleSubmit} className="search-form">
            <input
              ref={presetNameRef}
              className="input-prime"
              type="text"
              name="addPreset"
              placeholder={chrome.i18n.getMessage("presetsPlaceholder")}
              onChange={() => setErrorKey("")}
              {...{ spellCheck: "false" }}
            />
            <button type="submit">
              {chrome.i18n.getMessage("addPresetBtn")}
            </button>
          </form>

          <aside className="tip-left">
            <p className="useful-tip">{tipText}</p>
          </aside>

          <div className="list-wrapper">
            <ul className="location-list" onClick={() => 1}>
              {presets.map((preset) => {
                return (
                  <li
                    className={`list-item preset-list-item${selectedPreset?.key === preset.key ? " background-light-purple" : ""}`}
                    key={uuidv4()}
                    onClick={(e) => handleClickPreset(e, preset)}
                  >
                    <span className="preset-name">{preset.key}</span>
                    <button
                      className="delete-preset"
                      onClick={(e) => deletePreset(e, preset.key)}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </BaseModal>
      )}
    </>
  );
}
