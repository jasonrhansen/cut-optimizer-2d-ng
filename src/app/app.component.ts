import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'binpacker2d-ng';

  message = '';
  progress = 0;
  optimizing = false;
  optimizerResults = null;

  onOptimizeStart() {
    this.progress = 0;
    this.optimizing = true;
    this.optimizerResults = null;
  }

  onOptimizeProgress(progress: number) {
    this.progress = progress;
  }

  onOptimizeFinish(results: object) {
    this.optimizing = false;
    this.optimizerResults = results;
    // results will be null if the optimization was cancelled
    if (results !== null) {
      const fitness = results['fitness'].toFixed(5);
      this.message = `Fitness score: ${fitness}`;
    } else {
      this.message = '';
    }
  }

  onOptimizeError(msg: string) {
    this.optimizing = false;
    this.optimizerResults = null;
    this.message = `Error: ${msg}`;
  }
}
