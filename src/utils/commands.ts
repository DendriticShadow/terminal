import packageJson from "../../package.json";
import { get } from "svelte/store";
import { history } from "../stores/history";
import type { Command } from "../interfaces/command";
import { todoManager } from "./todo";

export const commands: Record<string, (args: string[]) => Promise<string> | string> = {
  help: () => {
    const commands = [
      "help",
      "whoami",
      "date",
      "todo",
      "weather",
      "history",
      "sudo",
      "email",
      "repo",
      "clear",
      "banner",
    ];

    return "Available commands:\n\n" + commands.join("\n");
  },
  whoami: async () => {
    const text = `  Hey, I'm Will! 🤗

  I've worked in IT since I was 18, specializing in DevSecOps for the past 6 years.
  I love building cloud infrastructure and solving (mostly creating) complex engineering problems.

  Dallas-based with a beautiful family.
  When I'm not learning a new skill, I'm lifting weights, gaming, watching movies, or spending time with the fam.`;

    // Add initial entry to history
    const currentHistory = get(history);
    history.set([...currentHistory, { command: 'whoami', outputs: [''] }]);

    // Animate character by character
    let output = '';
    const chars = text.split('');

    for (let i = 0; i < chars.length; i++) {
      output += chars[i];

      // Update the last history entry with progressive output
      const historyValue = get(history);
      const lastEntry = historyValue[historyValue.length - 1];
      lastEntry.outputs = [output];
      history.set([...historyValue.slice(0, -1), { ...lastEntry }]);

      // Delay between characters (adjust speed: lower = faster)
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    return null; // Return null to prevent duplicate entry
  },
  date: () => new Date().toLocaleString(),
  sudo: (args: string[]) => {
    window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    return `Permission denied: unable to run the command '${args[0]}' as root.`;
  },
  history: () => {
    const hist = get(history);
    if (hist.length === 0) {
      return "No command history.";
    }
    return hist.map((cmd: Command, i: number) => `${i + 1}  ${cmd.command}`).join("\n");
  },
  repo: () => {
    window.open(packageJson.repository.url, "_blank");

    return "Opening repository...";
  },
  clear: () => {
    history.set([]);

    return "";
  },
  email: () => {
    window.open(`mailto:${packageJson.author.email}`);

    return `Opening mailto:${packageJson.author.email}...`;
  },
  weather: async (args: string[]) => {
    const city = args.join("+");

    if (!city) {
      return "Usage: weather [city]. Example: weather Brussels";
    }

    const weather = await fetch(`https://wttr.in/${city}?ATm`);

    return weather.text();
  },
  banner: () => `
██╗  ██╗███████╗██╗      ██████╗        ██╗ 
██║  ██║██╔════╝██║     ██╔═══██╗    ██╗╚██╗
███████║█████╗  ██║     ██║   ██║    ╚═╝ ██║
██╔══██║██╔══╝  ██║     ██║   ██║    ██╗ ██║
██║  ██║███████╗███████╗╚██████╔╝    ╚═╝██╔╝
╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝        ╚═╝

Type 'help' to see list of available commands.
`,
  todo: (args: string[]) => {
    const usage = `Usage: todo [command] [args]

Commands:
  add <text>     Add a new todo
  ls [filter]    List todos (filter: all, completed, pending)
  done <id>      Mark todo as completed
  rm <id>        Remove a todo
  clear [completed]  Clear todos (add 'completed' to clear only completed)
  stats          Show todo statistics

Examples:
  todo add Buy groceries
  todo ls
  todo ls pending
  todo done 1
  todo rm 2
  todo clear completed`;

    if (args.length === 0) {
      return usage;
    }

    const [subCommand, ...subArgs] = args;

    switch (subCommand) {
      case "add":
        if (subArgs.length === 0) {
          return "Error: Please provide todo text. Example: todo add Buy milk";
        }
        return todoManager.add(subArgs.join(" "));

      case "ls":
      case "list":
        const filter = subArgs[0] as
          | "all"
          | "completed"
          | "pending"
          | undefined;
        if (filter && !["all", "completed", "pending"].includes(filter)) {
          return "Error: Invalid filter. Use: all, completed, or pending";
        }
        return todoManager.list(filter);

      case "done":
      case "complete":
        const completeId = parseInt(subArgs[0]);
        if (isNaN(completeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.complete(completeId);

      case "rm":
      case "remove":
      case "delete":
        const removeId = parseInt(subArgs[0]);
        if (isNaN(removeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.remove(removeId);

      case "clear":
        const onlyCompleted = subArgs[0] === "completed";
        return todoManager.clear(onlyCompleted);

      case "stats":
        return todoManager.stats();

      default:
        return `Unknown todo command: ${subCommand}\n\n${usage}`;
    }
  },
};
