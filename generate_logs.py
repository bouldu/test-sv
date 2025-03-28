import csv
import random
from datetime import datetime, timedelta

def generate_event_logs(event_types, num_lines, output_file):
    units = [f"Unit_{i}" for i in range(1, num_lines // 10 + 2)]  # Définir des unités
    event_logs = []
    
    for unit in units:
        timestamp = datetime.now() - timedelta(days=random.randint(0, 30))
        past_events = []
        
        for _ in range(num_lines // len(units)):
            event = random.choice(event_types)
            
            # Introduire des boucles : parfois, répéter un événement passé
            if past_events and random.random() < 0.2:
                event = random.choice(past_events)
            
            # Introduire des reworks : revenir en arrière dans la timeline
            if random.random() < 0.1 and past_events:
                timestamp -= timedelta(days=random.randint(1, 5))
            
            event_logs.append((unit, event, timestamp.strftime('%Y-%m-%d %H:%M:%S')))
            past_events.append(event)
            timestamp += timedelta(days=random.randint(1, 5))
    
    # Trier par unitName puis eventStartDate
    event_logs.sort(key=lambda x: (x[0], x[2]))
    
    # Écriture dans un fichier CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["unitName", "eventName", "eventStartDate"])
        writer.writerows(event_logs)
    
    print(f"Fichier généré : {output_file}")

# Paramètres personnalisables
event_types = ["Order Received", "Processing", "Packaging", "Quality Check", "Dispatched", "In Transit", "Customs Clearance", "Warehouse Arrival", "Out for Delivery", "Delivered"]
num_lines = 20000  # Nombre de lignes dans le fichier
output_file = "generated_events_logs.csv"

generate_event_logs(event_types, num_lines, output_file)