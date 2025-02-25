import { Component, OnInit } from '@angular/core';
import { DefaultList } from 'src/app/interfaces/defaultList';
import { EncounterService } from 'src/app/services/encounter/encounter.service';

@Component({
  selector: 'app-encounter',
  templateUrl: './encounter.component.html',
  styleUrls: ['./encounter.component.css'],
})
export class EncounterComponent implements OnInit {
  locations!: DefaultList;
  locationAreas!: DefaultList;

  constructor(public encounterService: EncounterService) {}

  ngOnInit(): void {
    this.getLocations();
    this.getLocationAreas();
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
      this.locationAreas = res;
    });
  }
}
