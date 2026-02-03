import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./styles/demo.css";

// Import demo components
import DemoWidget from "./components/DemoWidget.vue";
import LiveCertificateSelector from "./components/LiveCertificateSelector.vue";
import LiveSigningWidget from "./components/LiveSigningWidget.vue";
import LiveMobileQR from "./components/LiveMobileQR.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global demo components
    app.component("DemoWidget", DemoWidget);
    app.component("LiveCertificateSelector", LiveCertificateSelector);
    app.component("LiveSigningWidget", LiveSigningWidget);
    app.component("LiveMobileQR", LiveMobileQR);
  },
} satisfies Theme;
