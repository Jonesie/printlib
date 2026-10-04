import { useConfig } from "../api/useConfig";

// The stock Buy Me a Coffee button (as in mem3d). Hidden unless a username is configured.
export default function CoffeeButton() {
  const config = useConfig();
  if (!config?.buyMeACoffeeUrl) return null;

  return (
    <a href={config.buyMeACoffeeUrl} target="_blank" rel="noopener noreferrer" className="block text-center">
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        width={194}
        height={54}
        className="inline-block"
      />
    </a>
  );
}
