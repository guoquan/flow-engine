import * as THREE from 'three';

const HEAD_OFFSET_Y = 2.5; // Slightly higher for 3D bubbles
const BUBBLE_SCALE = 1.0;

export class BubbleManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private sprite: THREE.Sprite;
  private target: THREE.Object3D | null = null;
  private offset = new THREE.Vector3(0, HEAD_OFFSET_Y, 0);
  private visible = false;
  
  // Canvas configuration
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    // Initialize Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context for BubbleManager');
    this.ctx = context;

    // Initialize Texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    
    // Initialize Sprite
    const material = new THREE.SpriteMaterial({ 
      map: this.texture, 
      transparent: true,
      depthTest: false, // Ensure it draws on top of some things, or use standard occlusion
      depthWrite: false
    });
    
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(2, 1, 1); // Aspect ratio for the canvas
    this.sprite.visible = false;
    this.sprite.renderOrder = 999; // Draw late to appear in front

    this.scene.add(this.sprite);
  }

  public setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  public show(text: string, type: 'speech' | 'thought' = 'speech') {
    this.drawBubble(text, type);
    this.sprite.visible = true;
    this.visible = true;
    this.update();
  }

  public hide() {
    this.sprite.visible = false;
    this.visible = false;
  }

  public update() {
    if (!this.visible || !this.target) return;

    // Simple 3D tracking: Position above the head
    const targetPos = new THREE.Vector3();
    this.target.getWorldPosition(targetPos);
    this.sprite.position.copy(targetPos).add(this.offset);
  }

  private drawBubble(text: string, type: 'speech' | 'thought') {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // Config
    const padding = 20;
    const borderRadius = 40;
    const tailHeight = 40;
    
    // Measure Text to adjust bubble size (simplified: fixed max width, variable internal padding)
    ctx.font = 'bold 40px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    const rectW = w - padding * 2;
    const rectH = h - tailHeight - padding * 2;
    const rectX = padding;
    const rectY = padding;

    if (type === 'speech') {
        this.drawRoundedRect(ctx, rectX, rectY, rectW, rectH, borderRadius);
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(w / 2 - 20, rectY + rectH);
        ctx.lineTo(w / 2, rectY + rectH + tailHeight);
        ctx.lineTo(w / 2 + 20, rectY + rectH);
        ctx.fill();
    } else {
        // Thought bubble (cloud)
        this.drawCloud(ctx, rectX, rectY, rectW, rectH);
        
        // Small circles for thought tail
        ctx.beginPath();
        ctx.arc(w / 2 - 20, rectY + rectH + 10, 8, 0, Math.PI * 2);
        ctx.arc(w / 2, rectY + rectH + 30, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Text
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    
    // Simple word wrap
    const words = text.split(' ');
    let line = '';
    const lineHeight = 50;
    const maxWidth = rectW - 40;
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Center vertically
    const totalTextHeight = lines.length * lineHeight;
    let y = rectY + (rectH - totalTextHeight) / 2 + lineHeight / 2;

    for (let k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], w / 2, y);
        y += lineHeight;
    }

    // Update texture
    this.texture.needsUpdate = true;
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.beginPath();
    const radius = 30;
    
    // Draw multiple overlapping circles
    // Top
    ctx.arc(x + w * 0.2, y + h * 0.3, radius, Math.PI, Math.PI * 2); // Top Left
    ctx.arc(x + w * 0.5, y + h * 0.1, radius * 1.2, Math.PI, Math.PI * 2); // Top Center
    ctx.arc(x + w * 0.8, y + h * 0.3, radius, Math.PI, Math.PI * 2); // Top Right

    // Right
    ctx.arc(x + w * 0.9, y + h * 0.5, radius * 0.8, -Math.PI/2, Math.PI/2);
    
    // Bottom
    ctx.arc(x + w * 0.8, y + h * 0.7, radius, 0, Math.PI);
    ctx.arc(x + w * 0.5, y + h * 0.9, radius * 1.2, 0, Math.PI);
    ctx.arc(x + w * 0.2, y + h * 0.7, radius, 0, Math.PI);

    // Left
    ctx.arc(x + w * 0.1, y + h * 0.5, radius * 0.8, Math.PI/2, Math.PI * 1.5);
    
    ctx.closePath();
    ctx.fill();
  }
}