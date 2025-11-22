import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NutriIcon } from "@/components/atoms/NutriIcon";
import { Tooltip } from "@/components/molecules/Tooltip";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/contexts/ThemeContext";
import { hapticFeedback } from "@/utils/haptic";
import "./NavigationBar.styles.css";

export interface NavigationItem {
  id: string;
  path: string;
  label: string;
  icon: string;
  iconFilled?: string;
  shortcut?: {
    key: string;
    modifier?: "cmd" | "ctrl" | "alt";
  };
  badge?: number;
  ariaLabel?: string;
}

export interface NavigationBarProps {
  items?: NavigationItem[];
  onNavigate?: (path: string) => void;
}

const defaultItems: NavigationItem[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    icon: "house",
    iconFilled: "house.fill",
    shortcut: { key: "H", modifier: "cmd" },
    ariaLabel: "Ir para página inicial",
  },
  {
    id: "diary",
    path: "/diary",
    label: "Diário",
    icon: "book",
    iconFilled: "book.fill",
    shortcut: { key: "D", modifier: "cmd" },
    ariaLabel: "Ir para diário alimentar",
  },
  {
    id: "plan",
    path: "/plan",
    label: "Plano",
    icon: "chart.bar",
    iconFilled: "chart.bar.fill",
    shortcut: { key: "P", modifier: "cmd" },
    ariaLabel: "Ir para plano alimentar",
  },
  {
    id: "progress",
    path: "/progress",
    label: "Progresso",
    icon: "chart.line.uptrend.xyaxis",
    iconFilled: "chart.line.uptrend.xyaxis",
    shortcut: { key: "G", modifier: "cmd" },
    ariaLabel: "Ir para análise de progresso",
  },
  {
    id: "profile",
    path: "/profile",
    label: "Perfil",
    icon: "person.crop.circle",
    iconFilled: "person.crop.circle.fill",
    shortcut: { key: ",", modifier: "cmd" },
    ariaLabel: "Ir para perfil e configurações",
  },
];

const SIDEBAR_STORAGE_KEY = "nutri-sidebar-state";

const ThemeToggleButton: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";

  return (
    <button
      className="sidebar-theme-toggle"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Alternar tema (atual: ${theme})`}
    >
      <NutriIcon name={theme === "dark" ? "moon.fill" : theme === "light" ? "sun.max.fill" : "cloud.sun.fill"} />
      <span className="sidebar-theme-toggle__label">Tema: {theme}</span>
    </button>
  );
};

export const NavigationBar: React.FC<NavigationBarProps> = ({ items = defaultItems, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isMobile = useMediaQuery("(max-width: 899px)");
  const isTabletPortrait = useMediaQuery("(orientation: portrait) and (max-width: 1199px)");

  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === "expanded" || saved === null;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobile && !isTabletPortrait) {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarExpanded ? "expanded" : "collapsed");
    }
  }, [isMobile, isTabletPortrait, isSidebarExpanded]);

  const handleNavigation = useCallback(
    (path: string) => {
      hapticFeedback.light();
      navigate(path);
      onNavigate?.(path);
    },
    [navigate, onNavigate]
  );

  const toggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
    hapticFeedback.medium();
  };

  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const shortcuts = useMemo(
    () =>
      items
        .filter((item) => Boolean(item.shortcut))
        .map((item) => ({
          key: item.shortcut!.key,
          modifier: item.shortcut!.modifier,
          enabled: !isMobile && !isTabletPortrait,
          callback: () => handleNavigation(item.path),
        })),
    [handleNavigation, isMobile, isTabletPortrait, items]
  );

  useKeyboardShortcut(shortcuts, [handleNavigation]);

  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.path);
    const icon = active && item.iconFilled ? item.iconFilled : item.icon;
    const badge = item.badge && item.badge > 0 ? (item.badge > 9 ? "9+" : item.badge) : null;

    const button = (
      <button
        key={item.id}
        className={`nav-item ${active ? "nav-item--active" : ""}`}
        onClick={() => handleNavigation(item.path)}
        aria-label={item.ariaLabel || item.label}
        aria-current={active ? "page" : undefined}
      >
        <div className="nav-item__icon-wrapper">
          <NutriIcon name={icon} size="medium" />
          {badge && <span className="nav-item__badge" aria-label={`${badge} notificações`}>{badge}</span>}
        </div>
        <span className="nav-item__label">{item.label}</span>
        {active && <span className="nav-item__indicator" aria-hidden="true" />}
      </button>
    );

    if (!isMobile && !isTabletPortrait && !isSidebarExpanded) {
      return (
        <Tooltip
          key={item.id}
          position="right"
          content={
            <span className="tooltip-content">
              {item.label}
              {item.shortcut && (
                <kbd className="tooltip-shortcut">{`${item.shortcut.modifier === "cmd" ? "⌘" : "Ctrl+"}${item.shortcut.key}`}</kbd>
              )}
            </span>
          }
        >
          {button}
        </Tooltip>
      );
    }

    return <div key={item.id}>{button}</div>;
  };

  if (isMobile || isTabletPortrait) {
    return (
      <nav className="nav-bottom" role="navigation" aria-label="Navegação principal">
        {items.map(renderNavItem)}
      </nav>
    );
  }

  return (
    <aside
      className={`nav-sidebar ${isSidebarExpanded ? "nav-sidebar--expanded" : "nav-sidebar--collapsed"}`}
      role="navigation"
      aria-label="Navegação principal"
      data-expanded={isSidebarExpanded}
    >
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarExpanded ? "Recolher menu" : "Expandir menu"}
        aria-expanded={isSidebarExpanded}
      >
        <NutriIcon name="sidebar.left" />
      </button>

      <div className="sidebar-content">
        {items.map((item) => {
          const active = isActive(item.path);
          const icon = active && item.iconFilled ? item.iconFilled : item.icon;
          const badge = item.badge && item.badge > 0 ? (item.badge > 9 ? "9+" : item.badge) : null;

          return (
            <button
              key={item.id}
              className={`nav-item ${active ? "nav-item--active" : ""}`}
              onClick={() => handleNavigation(item.path)}
              aria-label={item.ariaLabel || item.label}
              aria-current={active ? "page" : undefined}
            >
              <div className="nav-item__icon-wrapper">
                <NutriIcon name={icon} size="medium" />
                {badge && <span className="nav-item__badge">{badge}</span>}
              </div>

              {isSidebarExpanded && (
                <>
                  <span className="nav-item__label">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="nav-item__shortcut">{`${item.shortcut.modifier === "cmd" ? "⌘" : "Ctrl+"}${item.shortcut.key}`}</kbd>
                  )}
                </>
              )}

              {active && <span className="nav-item__indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <ThemeToggleButton />
        <div className="sidebar-footer__meta" aria-live="polite">
          {theme === "auto" ? "Seguindo sistema" : `Tema ${theme}`}
        </div>
      </div>
    </aside>
  );
};

export default NavigationBar;
