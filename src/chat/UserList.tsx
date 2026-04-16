import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatStore } from "./useChatStore";

export function UserList() {
  const usersOnline = useChatStore((s) => s.usersOnline);
  const currentNick = useChatStore((s) => s.currentNick);

  if (usersOnline.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum usuário online
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs font-medium">
        Online ({usersOnline.length})
      </p>
      {usersOnline.map((nick) => (
        <div key={nick} className="flex items-center gap-2.5 py-0.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-wa-teal text-xs text-white">
              {nick.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">
            {nick}
            {nick === currentNick && (
              <span className="text-muted-foreground ml-1">(você)</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
