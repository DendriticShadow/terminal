<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';
  import { history } from '../stores/history';
  import { theme } from '../stores/theme';
  import { commands } from '../utils/commands';
  import { track } from '../utils/tracking';
  import { bannerAnimationComplete } from '../stores/bannerAnimation';

  let command = '';
  let historyIndex = -1;

  let input: HTMLInputElement;

  onMount(async () => {
    if ($history.length === 0) {
      const bannerCommand = commands['banner'] as () => string;

      if (bannerCommand) {
        const bannerText = bannerCommand();
        const lines = bannerText.split('\n');

        // Animate banner line by line
        let currentOutput = '';
        for (let i = 0; i < lines.length; i++) {
          currentOutput += (i > 0 ? '\n' : '') + lines[i];
          $history = [{ command: 'banner', outputs: [currentOutput] }];

          // Delay between lines (adjust speed here: lower = faster)
          await new Promise(resolve => setTimeout(resolve, 95));
        }

        // Mark animation as complete
        bannerAnimationComplete.set(true);

        // Focus input after animation
        await new Promise(resolve => setTimeout(resolve, 100));
        input.focus();
      }
    } else {
      // If history exists (returning user), skip animation
      bannerAnimationComplete.set(true);
      input.focus();
    }
  });

  afterUpdate(() => {
    input.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });

  const handleKeyDown = async (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      const [commandName, ...args] = command.split(' ');

      if (import.meta.env.VITE_TRACKING_ENABLED === 'true') {
        track(commandName, ...args);
      }

      const commandFunction = commands[commandName];

      if (commandFunction) {
        const output = await commandFunction(args);

        // Only add to history if command didn't already handle it (output !== null)
        if (commandName !== 'clear' && output !== null) {
          $history = [...$history, { command, outputs: [output] }];
        }
      } else {
        const output = `${commandName}: command not found`;

        $history = [...$history, { command, outputs: [output] }];
      }

      command = '';
    } else if (event.key === 'ArrowUp') {
      if (historyIndex < $history.length - 1) {
        historyIndex++;

        command = $history[$history.length - 1 - historyIndex].command;
      }

      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      if (historyIndex > -1) {
        historyIndex--;
        command =
          historyIndex >= 0
            ? $history[$history.length - 1 - historyIndex].command
            : '';
      }
      event.preventDefault();
    } else if (event.key === 'Tab') {
      event.preventDefault();

      const autoCompleteCommand = Object.keys(commands).find((cmd) =>
        cmd.startsWith(command),
      );

      if (autoCompleteCommand) {
        command = autoCompleteCommand;
      }
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();

      $history = [];
    }
  };
</script>

<svelte:window
  on:click={() => {
    input.focus();
  }}
/>

<div class="flex w-full">
  <p class="visible md:hidden">❯</p>

  <input
    id="command-input"
    name="command-input"
    aria-label="Command input"
    class="w-full px-2 bg-transparent outline-none"
    type="text"
    style={`color: ${$theme.foreground}`}
    bind:value={command}
    on:keydown={handleKeyDown}
    bind:this={input}
  />
</div>
