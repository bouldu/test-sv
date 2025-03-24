<script lang="ts">
	import Timeline from './Timeline.svelte';
	interface Props {
		width: number;
		height: number;
		minDate: Date;
		maxDate: Date;
		currentDate: Date;
		onUpdateIsPlaying: (playing: boolean) => void;
	}

	let {
		width = 500,
		height = 8,
		minDate = new Date('2024-01-01T00:00:00'),
		maxDate = new Date('2024-12-31T23:59:59'),
		currentDate = $bindable(new Date(minDate)),
		onUpdateIsPlaying
		// currentDate = $bindable(new Date(minDate))
	}: Props = $props();

	let progress = $state(0);
	let speedUnit = $state(1000 * 60 * 60 * 24); // 1 day per s

	$effect(() => {
		currentDate = new Date(
			minDate.getTime() + (progress / 100) * (maxDate.getTime() - minDate.getTime())
		);
	});

	$effect(() => {
		progress =
			((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
	});

	const formatDate = (date: Date) =>
		date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });

	let isPlaying = $state(false);
	let animationFrame: number;
	let lastTimestamp: number | null = null;

	function play() {
		isPlaying = true;
		lastTimestamp = null; // Reset timestamp when starting
		animationFrame = requestAnimationFrame(animate);
		onUpdateIsPlaying(isPlaying);
	}

	function pause() {
		isPlaying = false;
		cancelAnimationFrame(animationFrame);
		onUpdateIsPlaying(isPlaying);
	}

	function reset() {
		pause();
		progress = 0;
	}

	function animate(timestamp: number) {
		if (!isPlaying) {
			return;
		}

		if (lastTimestamp !== null) {
			const elapsed = timestamp - lastTimestamp;
			const progressIncrement =
				(elapsed / 1000) * (speedUnit / (maxDate.getTime() - minDate.getTime())) * 100;
			progress = Math.min(100, progress + progressIncrement);
		}

		lastTimestamp = timestamp;
		animationFrame = requestAnimationFrame(animate);
	}
</script>

<div class="current-date">
	{formatDate(currentDate)}
</div>

<div class="log-timeline">
	<div class="top-container">
		<span class="date left">{formatDate(minDate)}</span>
		<span class="date right">{formatDate(maxDate)}</span>
	</div>
	<Timeline bind:progress {width} {height} />
</div>

<div class="controls">
	{#if isPlaying}
		<button onclick={pause}>Pause</button>
	{:else}
		<button onclick={play}>Play</button>
	{/if}
	<button onclick={reset}>Reset</button>
</div>

<style>
	.top-container {
		display: flex;
		justify-content: space-between;
	}
	.date {
		font-size: 14px;
		font-weight: bold;
		/* background: rgba(0, 0, 0, 0.7);
		padding: 5px 10px;
		border-radius: 5px;
		margin: 5px 0; */
	}

	.current-date {
		display: inline-block; /* Fit content */
		text-align: center;
		color: #fff;
		font-size: 16px;
		font-weight: bold;
		background: rgba(0, 0, 0, 0.7);
		padding: 5px 10px;
		border-radius: 5px;
		position: relative;
		left: 50%;
		transform: translateX(-50%);
	}

	.controls {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 10px;
	}

	.controls button {
		padding: 5px 10px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.controls button:hover {
		background-color: #0056b3;
	}
</style>
