import deepseekLogo from "@/assets/logoss/deepseek.svg";
import kimiLogo from "@/assets/logoss/kimi.svg";
import stepfunLogo from "@/assets/logoss/stepfun.svg";
import minimaxLogo from "@/assets/logoss/minimax.svg";
import zhipuLogo from "@/assets/logoss/zhipu.svg";
import qwenLogo from "@/assets/logoss/qwen.svg";
import doubaoLogo from "@/assets/logoss/doubao.svg";
import bailingLogo from "@/assets/logoss/bailing.svg";
import mimoLogo from "@/assets/logoss/mimo.svg";
import katLogo from "@/assets/logoss/kat.svg";
import longcatLogo from "@/assets/logoss/longcat.svg";
import siliconflowLogo from "@/assets/logoss/siliconflow.svg";
import shengsuanyunLogo from "@/assets/logoss/shengsuanyun.svg";
import modelscopeLogo from "@/assets/logoss/modelscope.svg";
import openaiLogo from "@/assets/logoss/openai.svg";
import anthropicLogo from "@/assets/logoss/anthropic.svg";
import geminiLogo from "@/assets/logoss/gemini.svg";
import groqLogo from "@/assets/logoss/groq.svg";
import mistralLogo from "@/assets/logoss/mistral.svg";
import xaiLogo from "@/assets/logoss/xai.svg";
import baiduLogo from "@/assets/logoss/baidu.svg";
import nvidiaLogo from "@/assets/logoss/nvidia.svg";
import byteplusLogo from "@/assets/logoss/byteplus.svg";

/** Maps icon names (from LOGO_ALIASES) to SVG logo sources. */
export const PROVIDER_LOGOS: Record<string, string> = {
  deepseek: deepseekLogo,
  kimi: kimiLogo,
  stepfun: stepfunLogo,
  minimax: minimaxLogo,
  zhipu: zhipuLogo,
  qwen: qwenLogo,
  doubao: doubaoLogo,
  bailing: bailingLogo,
  mimo: mimoLogo,
  kat: katLogo,
  longcat: longcatLogo,
  siliconflow: siliconflowLogo,
  shengsuanyun: shengsuanyunLogo,
  modelscope: modelscopeLogo,
  openai: openaiLogo,
  anthropic: anthropicLogo,
  gemini: geminiLogo,
  groq: groqLogo,
  mistral: mistralLogo,
  xai: xaiLogo,
  baidu: baiduLogo,
  nvidia: nvidiaLogo,
  byteplus: byteplusLogo,
};

/** Returns the SVG logo URL for a provider, or null if no logo exists. */
export function getProviderLogoSrc(icon: string | undefined): string | null {
  if (!icon) return null;
  return PROVIDER_LOGOS[icon] ?? null;
}
