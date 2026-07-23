import { MouseEvent, MouseEventHandler, useEffect, useRef } from "react";

import { Tooltip } from "react-tooltip";
import { v4 as uuidv4 } from "uuid";

import icon from "../../assets/cross.svg";

type TBaseModal = {
  children: React.ReactNode;
  handleClose: () => void;
  title: string;
  tooltipTexts: string[];
};

export function BaseModal(props: TBaseModal) {
  const { children, handleClose, title, tooltipTexts } = props;

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, []);

  const handleClickOutDialog: MouseEventHandler<HTMLDialogElement> = (
    e: MouseEvent,
  ) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <dialog ref={dialogRef} onClick={handleClickOutDialog}>
      <button onClick={handleClose} className="icon-btn">
        <img src={icon} alt="close" className="big-image" />
      </button>

      <section className="modal-content">
        <h2 className="header-with-tooltip">
          {title}
          <a className="my-anchor-element">?</a>
        </h2>

        {children}
      </section>

      <Tooltip anchorSelect=".my-anchor-element" place="bottom">
        {tooltipTexts.map((val) => {
          return <p key={uuidv4()}>{val}</p>;
        })}
      </Tooltip>
    </dialog>
  );
}
