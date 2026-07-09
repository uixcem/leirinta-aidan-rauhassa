import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

function toStoredUrl(path: string) {
  return `/api/public/media/${path}`;
}

function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/api\/public\/media\/(.+)$/);
  return m ? m[1] : null;
}

export function MediaUpload({
  label,
  accept,
  value,
  onChange,
  hint,
  kind,
}: {
  label: string;
  accept: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  hint?: string;
  kind: "image" | "video";
}) {
  const { t } = useTranslation("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${kind}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      // best-effort delete of prior file
      const old = pathFromUrl(value);
      if (old) await supabase.storage.from("site-media").remove([old]);
      onChange(toStoredUrl(path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-forest/15 bg-white p-4">
      <div className="text-[15px] font-semibold text-forest">{label}</div>
      {hint && <p className="mt-1 text-[13px] text-stone">{hint}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {value ? (
          kind === "image" ? (
            <img
              src={value}
              alt=""
              className="h-24 w-32 rounded-md border border-forest/10 object-cover"
            />
          ) : (
            <video
              src={value}
              className="h-24 w-32 rounded-md border border-forest/10 object-cover"
              muted
              playsInline
            />
          )
        ) : (
          <div className="grid h-24 w-32 place-items-center rounded-md border border-dashed border-forest/30 text-[13px] text-stone">
            {kind === "image" ? "—" : t("cms.noVideo")}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-11 items-center rounded-md bg-forest px-4 text-[15px] font-medium text-birch hover:bg-forest-deep disabled:opacity-60"
          >
            {uploading
              ? t("cms.uploading")
              : kind === "image"
                ? t("cms.uploadImage")
                : t("cms.uploadVideo")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex min-h-11 items-center rounded-md border border-forest/20 px-4 text-[14px] text-stone hover:bg-birch-deep"
            >
              {t("cms.remove")}
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
    </div>
  );
}
