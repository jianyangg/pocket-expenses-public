import type { SVGProps } from "react";
const paths = {
  overview: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  activity: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  review: "m4 12 5 5L20 6M4 4h6M4 8h3",
  statements: "M4 20h16M7 16V9m5 7V4m5 12v-5",
  budget: "M3 6h18v14H3V6Zm0 4h18m-5 5h2M6 3h12",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
};
export default function InterfaceIcon({
  name,
  ...props
}: { name: keyof typeof paths } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
