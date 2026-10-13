import { _t } from "@net7/core";
import { _c } from "src/app/models/config";
import { ToastParams } from "src/app/services/toast.service";

const AI_SETTINGS_ACTION = "aisettings";

/** Page of the Pundit web app where the user manages the AI API keys. */
export const getAiSettingsLink = (): string => `${_c("userLink")}settings/ai`;

/** Button to the AI settings; the toast stays open so the user has time to click it. */
export const getAiSettingsToastParams = (): ToastParams => ({
  autoClose: false,
  actions: [
    {
      text: _t("toast#ai_error_open_settings"),
      payload: AI_SETTINGS_ACTION,
    },
  ],
  onAction: (payload, toast) => {
    if (payload === AI_SETTINGS_ACTION) {
      window.open(getAiSettingsLink(), "_blank", "noopener");
      toast.close();
    }
  },
});
