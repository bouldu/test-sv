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
		currentDate = new Date(minDate)
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
	<span class="date left">{formatDate(minDate)}</span>
	<Timeline bind:progress {width} {height} />
	<span class="date right">{formatDate(maxDate)}</span>
</div>

<style>
	.date {
		color: #fff;
		font-size: 14px;
		font-weight: bold;
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
