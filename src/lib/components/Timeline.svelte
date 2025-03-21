<script lang="ts">
	interface Props {
		width: number;
		height: number;
		progress: number;
	}

	let { width = 500, height = 8, progress = $bindable(0) }: Props = $props();
	let setProgress = (newProgress: number) => {
		progress = Math.min(100, Math.max(0, newProgress));
	};

	const updateProgress = (event: MouseEvent) => {
		const { left, width } = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const newProgress = ((event.clientX - left) / width) * 100;
		setProgress(newProgress);
	};

	const updateKeyProgress = (event: KeyboardEvent) => {
		console.log('event.key', event.key);
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
			return;
		}
		const newProgress = progress + (event.key === 'ArrowRight' ? 1 : -1);
		setProgress(newProgress);
	};
</script>

<div
	class="timeline"
	style="--width: {width}px; --height: {height}px;"
	onclick={updateProgress}
	onkeypress={updateKeyProgress}
	tabindex="0"
	role="button"
>
	<div class="progress" style="width: {progress}%;"></div>
</div>

<style>
	.timeline {
		width: var(--width);
		height: var(--height);
		background-color: #444;
		border-radius: 4px;
		cursor: pointer;
		overflow: hidden;
		position: relative;
	}

	.progress {
		height: 100%;
		background-color: #1db954;
		transition: width 0.1s linear;
	}
</style>
