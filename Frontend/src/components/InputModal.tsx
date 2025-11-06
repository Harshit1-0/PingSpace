import React, { useEffect, useMemo, useRef, useState } from "react";

type SelectOption = {
  label: string;
  value: string | number;
};

type FieldConfig = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "password"
    | "url"
    | "select";
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  options?: SelectOption[]; // for select
  rows?: number; // for textarea
  pattern?: string; // html pattern
  min?: number;
  max?: number;
  step?: number;
};

type InputModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  fields: FieldConfig[];
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string | number>) => void | Promise<void>;
  isSubmitting?: boolean;
};

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  description,
  fields,
  submitLabel = "Create",
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const initialValues = useMemo(() => {
    const init: Record<string, string | number> = {};
    (fields || []).forEach((f) => {
      init[f.name] = f.defaultValue ?? "";
    });
    return init;
  }, [fields]);

  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
    }
  }, [isOpen, initialValues]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleChange = (
    name: string,
    value: string | number
  ) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSubmitting === undefined) setInternalSubmitting(true);
      await onSubmit(values);
    } finally {
      if (isSubmitting === undefined) setInternalSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const submitting = isSubmitting ?? internalSubmitting;

  return (
    <div
      className="modal-overlay"
      aria-modal="true"
      role="dialog"
      aria-labelledby="input-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="input-modal-title" className="modal-title">
              {title}
            </h2>
            {description ? (
              <p className="modal-desc">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {(fields || []).map((field) => {
            const commonProps = {
              id: field.name,
              name: field.name,
              placeholder: field.placeholder,
              required: field.required,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                handleChange(field.name, e.target.value),
              value: values[field.name] ?? "",
              className: "modal-input",
            } as const;

            return (
              <div key={field.name} className="modal-field">
                <label htmlFor={field.name} className="modal-label">
                  {field.label}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    {...(commonProps as any)}
                    rows={field.rows ?? 3}
                    className="modal-textarea"
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    value={(values[field.name] as any) ?? ""}
                    className="modal-select"
                  >
                    <option value="" disabled={field.required}>
                      {field.placeholder ?? "Select an option"}
                    </option>
                    {(field.options || []).map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...(commonProps as any)}
                    type={field.type ?? "text"}
                    pattern={field.pattern}
                    min={field.min as any}
                    max={field.max as any}
                    step={field.step as any}
                  />
                )}
              </div>
            );
          })}

          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
