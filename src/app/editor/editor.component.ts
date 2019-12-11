import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray,
  Validators,
} from '@angular/forms';
import { OptimizerService } from '../optimizer.service';
import { CutPiece, StockPiece } from '../models';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
})
export class EditorComponent implements OnInit {
  @Output() optimizeStart = new EventEmitter();
  @Output() optimizeProgress = new EventEmitter<number>();
  @Output() optimizeFinish = new EventEmitter();
  @Output() optimizeError = new EventEmitter<string>();

  optimizing = false;

  form: FormGroup = this.fb.group({
    optimizeMethod: this.fb.control('', [Validators.required]),
    cutWidth: this.fb.control('', [Validators.required]),
    stockPieces: this.fb.array([]),
    cutPieces: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private optimizerService: OptimizerService
  ) {}

  ngOnInit() {
    this.optimizeMethodControl.setValue(this.optimizerService.optimizeMethod);
    this.cutWidthControl.setValue(this.optimizerService.cutWidth);
    this.getStockPieces();
    this.getCutPieces();
  }

  get optimizeMethodControl() {
    return this.form.controls.optimizeMethod as FormControl;
  }

  get cutWidthControl() {
    return this.form.controls.cutWidth as FormControl;
  }

  getStockPieces() {
    this.optimizerService
      .getStockPieces()
      .subscribe((stockPieces: StockPiece[]) => {
        for (let stockPiece of stockPieces) {
          this.addStockPiece(
            stockPiece.enabled,
            stockPiece.width.toString(),
            stockPiece.length.toString(),
            stockPiece.patternDirection.toString()
          );
        }
      });
  }

  get stockPieceFormArray() {
    return this.form.controls.stockPieces as FormArray;
  }

  addStockPiece(
    enabled: boolean,
    width: string,
    length: string,
    patternDirection: string
  ) {
    let stockPieceGroup = this.fb.group({
      enabled: [enabled],
      width: [width, Validators.required],
      length: [length, Validators.required],
      patternDirection: [patternDirection, Validators.required],
    });

    this.stockPieceFormArray.push(stockPieceGroup);
  }

  newStockPiece() {
    this.addStockPiece(true, '', '', '');
  }

  removeStockPiece(index: number) {
    this.stockPieceFormArray.removeAt(index);
  }

  getCutPieces() {
    this.optimizerService.getCutPieces().subscribe((cutPieces: CutPiece[]) => {
      let cutPieceQuantities = new Map<string, number>();
      for (let cutPiece of cutPieces) {
        let key = JSON.stringify(cutPiece);
        const quantity = cutPieceQuantities.get(key) || 0;
        cutPieceQuantities.set(key, quantity + 1);
      }

      for (let [key, quantity] of cutPieceQuantities) {
        const cutPiece = JSON.parse(key);
        this.addCutPiece(
          cutPiece.enabled,
          quantity.toString(),
          cutPiece.width.toString(),
          cutPiece.length.toString(),
          cutPiece.patternDirection.toString()
        );
      }
    });
  }

  get cutPieceFormArray() {
    return this.form.controls.cutPieces as FormArray;
  }

  addCutPiece(
    enabled: boolean,
    quantity: string,
    width: string,
    length: string,
    patternDirection: string
  ) {
    let cutPieceGroup = this.fb.group({
      enabled: [enabled],
      quantity: [quantity, Validators.required],
      width: [width, Validators.required],
      length: [length, Validators.required],
      patternDirection: [patternDirection, Validators.required],
    });

    this.cutPieceFormArray.push(cutPieceGroup);
  }

  newCutPiece() {
    this.addCutPiece(true, '', '', '', '');
  }

  removeCutPiece(index: number) {
    this.cutPieceFormArray.removeAt(index);
  }

  onSubmit() {
    this.optimizerService.optimizeMethod = this.optimizeMethodControl.value;
    this.optimizerService.cutWidth = this.cutWidthControl.value;

    this.optimizerService.clearStockPieces();
    for (let control of this.stockPieceFormArray.controls) {
      const stockPieceGroup = control as FormGroup;
      this.optimizerService.addStockPiece({
        enabled: stockPieceGroup.controls['enabled'].value,
        width: stockPieceGroup.controls['width'].value,
        length: stockPieceGroup.controls['length'].value,
        patternDirection: stockPieceGroup.controls['patternDirection'].value,
      });
    }

    this.optimizerService.clearCutPieces();
    for (let control of this.cutPieceFormArray.controls) {
      const demandPieceGroup = control as FormGroup;
      const enabled = demandPieceGroup.controls['enabled'].value;
      const quantity = demandPieceGroup.controls['quantity'].value;
      const width = demandPieceGroup.controls['width'].value;
      const length = demandPieceGroup.controls['length'].value;
      const patternDirection =
        demandPieceGroup.controls['patternDirection'].value;
      for (let i = 0; i < quantity; i++) {
        this.optimizerService.addCutPiece({
          enabled: enabled,
          width: width,
          length: length,
          patternDirection: patternDirection,
        });
      }
    }

    this.optimizing = true;
    this.optimizeStart.emit();

    this.optimizerService.optimize().subscribe({
      next: data => {
        if (data.type === 'progress') {
          this.optimizeProgress.emit(Math.round(data.progress * 100));
        } else if (data.type === 'finished') {
          this.optimizing = false;
          this.optimizeFinish.emit(data.solution);
        }
      },
      error: msg => {
        this.optimizing = false;
        this.optimizeError.emit(msg);
      },
    });
  }

  cancel() {
    this.optimizerService.cancel();
    this.optimizing = false;
    this.optimizeFinish.emit(null);
  }
}
