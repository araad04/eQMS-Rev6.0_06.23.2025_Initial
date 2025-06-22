import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  link: {
    text: string;
    href: string;
  };
}

export function StatusCard({ title, value, icon, iconBgColor, link }: StatusCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-neutral-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-200">
        <div className="text-sm">
          <Link href={link.href} className="font-medium text-primary hover:text-primary-dark">
            {link.text}
          </Link>
        </div>
      </div>
    </div>
  );
}
