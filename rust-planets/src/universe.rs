use crate::utils;
use std::mem;
use std::collections::HashMap;
use memoffset::offset_of;
use crate::log;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    orbits: Vec<EllipticalOrbit>,
    orbit_size: usize
}

#[wasm_bindgen]
impl Universe {
    pub fn new(width: u32, height: u32) -> Self {
        utils::set_panic_hook();
        Self {
            width,
            height,
            orbits: Vec::new(),
            orbit_size: mem::size_of::<EllipticalOrbit>(),
        }
    }

    pub fn dimensions(&self) -> Vec<u32> {
        vec![self.width, self.height]
    }

    pub fn update_dimensions(&mut self, width: u32, height: u32) {
        self.width = width;
        self.height = height;
    }

    pub fn add_orbit(&mut self, id: u32, focus_x: f64, focus_y: f64, major_axis: f64, minor_axis: f64, angle: f64, period: f64, orbital_offset: f64) {
        // log!("Adding orbit with id {}", id);
        self.orbits.push(EllipticalOrbit::new(id, focus_x, focus_y, major_axis, minor_axis, angle, period, orbital_offset));
    }

    pub fn num_orbits(&self) -> usize {
        self.orbits.len()
    }

    pub fn orbits(&self) -> *const EllipticalOrbit {
        self.orbits.as_ptr()
    }

    pub fn tick(&mut self, delta: f64, ellapsed: f64) {
        for orbit in &mut self.orbits {
            orbit.update(ellapsed);
        }
    }
}

#[repr(C)]
#[wasm_bindgen]
pub struct EllipticalOrbit {
    pub id: u32,
    pub x: f64,
    pub y: f64,
    pub focus_x: f64,
    pub focus_y: f64,
    pub center_x: f64,
    pub center_y: f64,
    pub major_axis: f64,
    pub minor_axis: f64,
    pub angle: f64,
    pub dir_to_focus: f64,
    pub period: f64,
    pub orbital_offset: f64,
    pub eccentricity: f64,
    pub orbit_length: usize,
    orbit: [(f64, f64); 1000],
    sin_angle: f64,
    cos_angle: f64
}

#[wasm_bindgen]
impl EllipticalOrbit {
    pub fn new(id: u32, focus_x: f64, focus_y: f64, mut major_axis: f64, mut minor_axis: f64, angle: f64, period: f64, orbital_offset: f64) -> Self {
        // Compute center based on focus 
        if major_axis < minor_axis {
            // Swap axes. Due to some randomization we want to allow this as a possibility.
            let temp = major_axis;
            major_axis = minor_axis;
            minor_axis = temp;
        }
        let eccentricity = (1.0 - minor_axis.powi(2) / major_axis.powi(2)).sqrt();
        let focus_distance = (major_axis.powi(2) - minor_axis.powi(2)).sqrt();
        let sin_angle = (-angle).sin();
        let cos_angle = (-angle).cos();
        let center_x = focus_x + focus_distance * cos_angle;
        let center_y = focus_y + focus_distance * sin_angle;
        let mut orbit = Self {
            id,
            x: 0.0,
            y: 0.0,
            focus_x,
            focus_y,
            center_x,
            center_y,
            major_axis,
            minor_axis,
            angle,
            dir_to_focus: 0.0,
            period,
            orbital_offset,
            eccentricity,
            orbit_length: 1000,
            orbit: [(0.0, 0.0); 1000],
            sin_angle: sin_angle,
            cos_angle: cos_angle
        };
        orbit.compute_total_orbit();
        orbit
    }

    pub fn offsets() -> JsValue {
        let mut offsets = HashMap::new();
        offsets.insert("id", offset_of!(Self, id));
        offsets.insert("x", offset_of!(Self, x));
        offsets.insert("y", offset_of!(Self, y));
        offsets.insert("focus_x", offset_of!(Self, focus_x));
        offsets.insert("focus_y", offset_of!(Self, focus_y));
        offsets.insert("center_x", offset_of!(Self, center_x));
        offsets.insert("center_y", offset_of!(Self, center_y));
        offsets.insert("major_axis", offset_of!(Self, major_axis));
        offsets.insert("minor_axis", offset_of!(Self, minor_axis));
        offsets.insert("angle", offset_of!(Self, angle));
        offsets.insert("dir_to_focus", offset_of!(Self, dir_to_focus));
        offsets.insert("period", offset_of!(Self, period));
        offsets.insert("orbital_offset", offset_of!(Self, orbital_offset));
        offsets.insert("eccentricity", offset_of!(Self, eccentricity));
        offsets.insert("orbit_length", offset_of!(Self, orbit_length));
        offsets.insert("orbit", offset_of!(Self, orbit));
        JsValue::from_serde(&offsets).unwrap()
    }

    pub fn size() -> usize {
        mem::size_of::<Self>()
    }

    fn compute_total_orbit (&mut self) {
        // We need a smart way to compute how many samples to take around the orbit. Something to do with a maximum bound on the angle formed between two connected lines.
        // For now we'll just take a fixed number of samples.
        let angle_step = 2.0 * std::f64::consts::PI / self.orbit_length as f64;
        let mut angle = 0.0;
        for i in 0..self.orbit_length {
            let (x, y) = self.get_xy(angle);
            self.orbit[i] = (x, y);
            angle += angle_step;
        }
    }

    fn get_xy(&self, cur_angle: f64) -> (f64, f64) {
        let cos_cur_angle = cur_angle.cos();
        let sin_cur_angle = cur_angle.sin();
        let x = self.major_axis * cos_cur_angle * self.cos_angle - self.minor_axis * sin_cur_angle * self.sin_angle + self.center_x;
        let y = self.major_axis * cos_cur_angle * self.sin_angle + self.minor_axis * sin_cur_angle * self.cos_angle + self.center_y;
        (x, y)
    }

    fn update(&mut self, ellapsed: f64) {
        let cur_angle = self.orbital_offset + 2.0 * std::f64::consts::PI * ellapsed / self.period;
        let (x, y) = self.get_xy(cur_angle);
        // Compute the direction to the focus
        self.dir_to_focus = (self.focus_y - y).atan2(self.focus_x - x);
        self.x = x;
        self.y = y
    }
}