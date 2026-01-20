import { Component, OnInit } from '@angular/core';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { EncounterService } from 'src/app/services/encounter/encounter.service';

@Component({
    selector: 'app-encounter',
    templateUrl: './encounter.component.html',
    styleUrls: ['./encounter.component.css'],
    standalone: false
})
export class EncounterComponent implements OnInit {
  locations!: DefaultList;
  regions!: DefaultList;
  allLocations: any[] = [];
  filteredLocations: any[] = [];
  selectedRegion: string = '';
  regionsCollapsed: boolean = false;
  locationsCollapsed: boolean = false;

  constructor(public encounterService: EncounterService) { }

  ngOnInit(): void {
    this.getRegions();
    this.getLocationsFromFile();
  }

  getLocations(): void {
    this.encounterService.getLocation().subscribe((res: any) => {
      //console.log(res);
      this.locations = res;
    });
  }

  getLocationAreas(): void {
    this.encounterService.getLocationAreas().subscribe((res: any) => {
      //console.log(res);
      this.allLocations = res;
    });
  }

  getRegions(): void {
    this.encounterService.getRegions().subscribe((res: any) => {
      this.regions = res;
    });
  }

  getLocationsFromFile(): void {
    this.encounterService.getLocationsFromFile().subscribe((res: any) => {
      this.allLocations = res.results || [];
      this.filteredLocations = []; // Don't show any locations initially
    });
  }

  onRegionSelected(regionName: string): void {
    this.selectedRegion = regionName;
    if (regionName === '') {
      this.filteredLocations = []; // Don't show any locations when no region is selected
    } else {
      // Filter locations that contain the region name in their name
      this.filteredLocations = this.allLocations.filter(location =>
        location.name.toLowerCase().includes(regionName.toLowerCase())
      );
    }
  }

  toggleRegions(): void {
    this.regionsCollapsed = !this.regionsCollapsed;
  }

  toggleLocations(): void {
    this.locationsCollapsed = !this.locationsCollapsed;
  }
}
