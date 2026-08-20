import { Component } from '@angular/core';
import { PublicHeaderComponent } from "../public-header/public-header.component";
import { PublicFooterComponent } from "../public-footer/public-footer.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-public-shell',
  imports: [PublicHeaderComponent, PublicFooterComponent, RouterModule],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss'
})
export class PublicShellComponent {

}
