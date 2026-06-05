import { useState } from "react";
import {
  User,
  Mail,
  Bell,
  Shield,
  Key,
  Camera,
  Save,
  LogOut,
} from "lucide-react";
import {
  useAppData,
} from "../context/AppDataContext";

export default function Profile() {
const {
  user,
  setUser,
} = useAppData();
  const [email, setEmail] = useState("user@example.com");

  const [priceAlerts, setPriceAlerts] =
    useState(true);

  const [newsAlerts, setNewsAlerts] =
    useState(true);

  const [aiAlerts, setAiAlerts] =
    useState(true);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Hero Section */}

      <div
        className="
        rounded-3xl
        bg-gradient-to-r
        from-cyan-600
        via-blue-600
        to-indigo-700
        p-8
        text-white
        shadow-xl
        "
      >
        <div className="flex flex-col md:flex-row items-center gap-6">

          <div className="relative">

            <div
              className="
              h-28
              w-28
              rounded-full
              bg-white/10
              backdrop-blur
              border
              border-white/20
              flex
              items-center
              justify-center
              "
            >
              <User className="h-14 w-14" />
            </div>

            <button
              className="
              absolute
              bottom-0
              right-0
              h-10
              w-10
              rounded-full
              bg-white
              text-cyan-600
              shadow-lg
              flex
              items-center
              justify-center
              "
            >
              <Camera className="h-5 w-5" />
            </button>

          </div>

          <div>

            <h1 className="text-4xl font-bold">
              My Profile
            </h1>

            <p className="text-white/80 mt-2">
              Manage your account, alerts and preferences.
            </p>

          </div>

        </div>
      </div>

      {/* Grid */}

      <div className="grid lg:grid-cols-[1fr_350px] gap-6">

        {/* LEFT */}

        <div className="space-y-6">

          {/* Personal Information */}

          <div
            className="
            rounded-3xl
            border
            border-slate-200
            dark:border-white/10
            bg-white
            dark:bg-night-900
            p-6
            "
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-cyan-500" />
              <h2 className="text-xl font-bold">
                Personal Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label className="text-sm text-slate-500">
                  Full Name
                </label>

                <input
                  value={user.name}
                  onChange={(e) =>
  setUser({
    ...user,
    name: e.target.value,
  })
}
                  className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  p-3
                  bg-transparent
                  "
                />
              </div>

              <div>
                <label className="text-sm text-slate-500">
                  Email
                </label>

                <input
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  p-3
                  bg-transparent
                  "
                />
              </div>

            </div>

            <button
              className="
              mt-6
              px-5
              py-3
              rounded-xl
              bg-cyan-500
              hover:bg-cyan-600
              text-white
              font-semibold
              flex
              items-center
              gap-2
              "
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>

          </div>

          {/* Notifications */}

          <div
            className="
            rounded-3xl
            border
            border-slate-200
            dark:border-white/10
            bg-white
            dark:bg-night-900
            p-6
            "
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-emerald-500" />
              <h2 className="text-xl font-bold">
                Notifications
              </h2>
            </div>

            <Toggle
              title="Price Alerts"
              value={priceAlerts}
              onChange={setPriceAlerts}
            />

            <Toggle
              title="Market News Alerts"
              value={newsAlerts}
              onChange={setNewsAlerts}
            />

            <Toggle
              title="AI Signals Alerts"
              value={aiAlerts}
              onChange={setAiAlerts}
            />

          </div>

          {/* Security */}

          <div
            className="
            rounded-3xl
            border
            border-slate-200
            dark:border-white/10
            bg-white
            dark:bg-night-900
            p-6
            "
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-violet-500" />
              <h2 className="text-xl font-bold">
                Security
              </h2>
            </div>

            <div className="space-y-3">

              <button
                className="
                w-full
                text-left
                p-4
                rounded-xl
                border
                hover:bg-slate-50
                dark:hover:bg-white/5
                "
              >
                Change Password
              </button>

              <button
                className="
                w-full
                text-left
                p-4
                rounded-xl
                border
                hover:bg-slate-50
                dark:hover:bg-white/5
                "
              >
                Enable Two-Factor Authentication
              </button>

            </div>

          </div>

        </div>

        {/* RIGHT SIDEBAR */}

        <div className="space-y-6">

          {/* Account Card */}

          <div
            className="
            rounded-3xl
            border
            border-slate-200
            dark:border-white/10
            bg-white
            dark:bg-night-900
            p-6
            "
          >
            <h3 className="font-bold text-lg mb-4">
              Account
            </h3>

            <div className="space-y-4">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Plan
                </span>

                <span className="font-semibold">
                  Free
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Status
                </span>

                <span className="text-emerald-500 font-semibold">
                  Active
                </span>
              </div>

            </div>

          </div>

          {/* API Keys */}

          <div
            className="
            rounded-3xl
            border
            border-slate-200
            dark:border-white/10
            bg-white
            dark:bg-night-900
            p-6
            "
          >
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-cyan-500" />
              <h3 className="font-bold text-lg">
                API Keys
              </h3>
            </div>

            <input
              placeholder="Enter API Key..."
              className="
              w-full
              rounded-xl
              border
              p-3
              bg-transparent
              "
            />
          </div>

          {/* Logout */}

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="
            w-full
            rounded-2xl
            bg-red-500
            hover:bg-red-600
            text-white
            py-3
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            "
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>

        </div>

      </div>

    </div>
  );
}

interface ToggleProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({
  title,
  value,
  onChange,
}: ToggleProps) {
  return (
    <div className="flex justify-between items-center py-4 border-b last:border-none">

      <span>{title}</span>

      <button
        onClick={() =>
          onChange(!value)
        }
        className={`
          relative
          w-14
          h-8
          rounded-full
          transition-all
          ${
            value
              ? "bg-cyan-500"
              : "bg-slate-300"
          }
        `}
      >
        <div
          className={`
            absolute
            top-1
            h-6
            w-6
            rounded-full
            bg-white
            transition-all
            ${
              value
                ? "left-7"
                : "left-1"
            }
          `}
        />
      </button>

    </div>
  );
}