import { useMemo } from "react";

export function useAvatar(name: string) {
  const avatarUrl = useMemo(() => {
    if (!name) return "";

    const formattedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff`;
  }, [name]);

  return avatarUrl;
}
