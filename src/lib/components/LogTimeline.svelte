<script lang="ts">
	import Timeline from './Timeline.svelte';
	interface Props {
		width: number;
		height: number;
		minDate: Date;
		maxDate: Date;
		currentDate: Date;
	}

	let {
		width = 500,
		height = 8,
		minDate = new Date('2024-01-01T00:00:00'),
		maxDate = new Date('2024-12-31T23:59:59'),
		currentDate = $bindable(new Date(minDate))
		// currentDate = $bindable(new Date(minDate))
	}: Props = $props();

	let progress = $state(0);

	$effect(() => {
		currentDate = new Date(
			minDate.getTime() + (progress / 100) * (maxDate.getTime() - minDate.getTime())
		);
	});

	$effect(() => {
		progress =
			((currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
	});

	// const handleProgressChange = (newProgress: number) => {
	// 	progress = newProgress;
	// };

	const formatDate = (date: Date) =>
		date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
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
		position: fixed;
		bottom: 70px;
		left: 50%;
		transform: translateX(-50%);
		color: #fff;
		font-size: 16px;
		font-weight: bold;
		background: rgba(0, 0, 0, 0.7);
		padding: 5px 10px;
		border-radius: 5px;
	}
</style>
