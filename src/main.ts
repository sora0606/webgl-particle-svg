import './style.css'
import Alpine from "alpinejs";
import ui from "@alpinejs/ui";
import components from "./components";

if (process.env.NODE_ENV !== "production") {
	console.log({ NODE_ENV: process.env.NODE_ENV });
}

Alpine.plugin(ui);
Alpine.plugin(components);

(window as any).Alpine = Alpine;
Alpine.start();
