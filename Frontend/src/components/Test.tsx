import InputModal from "./InputModal";
import { useState } from "react";

const test = () => {
  const [isOpen, setIsOpen] = useState(true);
  const title = "test";
  const description = "hello this for test";
  const fields = [
    {
      name: "name",
      label: "name",
      type: "text" as const,
    },
    {
      name: "email",
      label: "email",
      type: "email" as const,
    },
    {
      name: "password",
      label: "password",
      type: "password" as const,
    },
  ];
  const handleClose = () => {
    isOpen ? setIsOpen(false) : setIsOpen(true);
  };
  const submit = () => {
    setIsOpen(false);
  };
  return (
    <InputModal
      isOpen={isOpen}
      title={title}
      description={description}
      fields={fields}
      onClose={handleClose}
      onSubmit={submit}
    />
  );
};

export default test;
