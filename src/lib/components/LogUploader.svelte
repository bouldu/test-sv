<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Papa from 'papaparse';

	interface LogEntry {
		unitId: string;
		eventId: string;
		startDate: Date;
	}

	const dispatch = createEventDispatcher();

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) {
			return;
		}

		const file = target.files[0];
		const text = await file.text();
		parseCSV(text);
	}

	function parseCSV(text: string) {
		Papa.parse(text, {
			header: true,
			complete: (results) => {
				const logs: LogEntry[] = results.data.map((row: any) => ({
					unitId: row.name,
					eventId: row.event,
					startDate: new Date(row.startDate)
				}));
				dispatch('logsUploaded', logs);
			},
			error: (error: any) => {
				console.error('Erreur de parsing CSV :', error.message);
			}
		});
	}
</script>

<input type="file" accept=".csv" on:change={handleFileChange} />
