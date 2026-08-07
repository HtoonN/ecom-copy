<template>
  <v-row>
    <v-col cols="8">
      <v-card flat>
        <v-card-title>
          PREVIEW MATCHES ({{ toImportMatches.length }})
        </v-card-title>
        <v-card-text>
          <v-card>
            <v-data-table-virtual
              :headers="[
                { title: 'No.', key: 'no', align: 'start' },
                { title: 'Start', key: 'time_start', align: 'start' },
                { title: 'End', key: 'time_end', align: 'start' },
                { title: 'Court', key: 'court_name', align: 'start' },
                { title: 'Price', key: 'match_price', align: 'start' },
                { title: 'Paid', key: 'paid_amount', align: 'start' },
                { title: 'Customer', key: 'booking_name', align: 'start' },
                { title: 'Phone', key: 'booking_phone', align: 'start' },
              ]"
              item-value="name"
              :items="toImportMatches"
              height="790"
              fixed-header
            ></v-data-table-virtual>
          </v-card>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="4">
      <v-card flat>
        <v-row>
          <v-col :cols="12">
            <v-card-title> IMPORT MATCHES </v-card-title>
            <v-card-text>
              <v-row>
                <v-col>
                  <v-text-field
                    v-model="provider_token"
                    label="Token สนาม"
                    variant="outlined"
                    color="primary"
                    density="compact"
                    :rules="[(value) => !!value || 'ใส่ Token สนามเท่านั้น']"
                  >
                    <template v-slot:append-inner>
                      <v-icon v-if="checking_provider" color="primary"
                        >mdi-loading</v-icon
                      >
                    </template>
                  </v-text-field>
                </v-col>
                <v-col>
                  <v-btn @click="importFile()" color="primary">
                    <v-icon left>mdi-file-import</v-icon> &nbsp; SELECT FILE
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-col>

          <v-col :cols="12">
            <b>File Courts</b>
            <v-chip-group>
              <v-chip
                v-for="(court, i) in founded_courts"
                :key="i"
                color="primary"
              >
                {{ court }}
              </v-chip>
            </v-chip-group>
          </v-col>

          <v-col :cols="12">
            <b>Provider Courts ({{ provider_name }})</b>
            <v-chip-group>
              <v-chip
                v-for="(court, i) in provider_courts"
                :key="i"
                color="primary"
              >
                {{ court.name }}
              </v-chip>
            </v-chip-group>
          </v-col>

          <v-col :cols="12">
            <v-btn
              @click="handleImportClick"
              color="primary"
              :disabled="!canStartImport || importing"
            >
              <v-icon left>mdi-arrow-up</v-icon> &nbsp; UPLOAD MATCHES
            </v-btn>
            <template v-if="canStartImport">
              &nbsp;
              <b>Estimated Time: {{ importing ? countdownText : estimedTime }}</b>
            </template>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import Swal from "sweetalert2";
import httpClient from "../api/httpClient";
import * as XLSX from "xlsx-js-style";
import moment from "moment";
import axios from "axios";

export default {
  name: "ImportView",
  mounted() {
    const savedAvg = Number(localStorage.getItem("import_avg_seconds_per_match"));
    if (Number.isFinite(savedAvg) && savedAvg > 0) {
      this.avgSecondsPerMatch = savedAvg;
    }
  },
  computed: {
    toImportMatches() {
      return this.matches_file;
    },
    courtsIsCompatible() {
      const normalizeCourtName = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();
      const providerCourtNames = this.provider_courts.map(({ name }) =>
        normalizeCourtName(name)
      );

      return (
        this.founded_courts.length > 0 &&
        this.founded_courts.every((court) =>
          providerCourtNames.includes(normalizeCourtName(court))
        )
      );
    },
    unmatchedCourtNames() {
      const normalizeCourtName = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();
      const providerCourtNames = this.provider_courts.map(({ name }) =>
        normalizeCourtName(name)
      );

      return this.founded_courts.filter(
        (court) => !providerCourtNames.includes(normalizeCourtName(court))
      );
    },
    estimedTime() {
      const secondsPerMatch = this.avgSecondsPerMatch || 2;
      const time = Math.ceil(this.toImportMatches.length * secondsPerMatch);
      return moment.utc(time * 1000).format("HH:mm:ss");
    },
    canStartImport() {
      return (
        !!(this.provider_token || "").trim() && this.toImportMatches.length > 0
      );
    },
  },
  watch: {
    provider_token() {
      this.onProviderTokenInput();
    },
  },
  data() {
    return {
      checking_provider: false,
      provider_token: null,
      importing: false,
      providers: [],
      matches_file: [],
      founded_courts: [],
      provider_courts: [],
      provider_name: "",
      totalTimeNeeded: 0,
      countdownText: "",
      tokenCheckTimeout: null,
      avgSecondsPerMatch: 2,
    };
  },
  methods: {
    sanitizePhoneNumber(value) {
      return String(value || "").replace(/\D/g, "");
    },
    normalizeAmount(value) {
      const numeric = Number(String(value ?? "").replace(/,/g, "").trim());
      return Number.isFinite(numeric) ? numeric : 0;
    },
    normalizeDateTime(value) {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        // Excel serial date (1900 system): day 1 is 1900-01-01, JS epoch offset is 25569.
        const utcMillis = Math.round((value - 25569) * 86400 * 1000);
        return moment.utc(utcMillis).format("YYYY-MM-DD HH:mm:ss");
      }

      const asNumber = Number(String(value).trim());
      if (Number.isFinite(asNumber) && String(value).trim() !== "") {
        const utcMillis = Math.round((asNumber - 25569) * 86400 * 1000);
        return moment.utc(utcMillis).format("YYYY-MM-DD HH:mm:ss");
      }

      const parsed = moment(value, [
        "YYYY-MM-DD HH:mm:ss",
        "YYYY-MM-DD HH:mm",
        "DD/MM/YYYY HH:mm:ss",
        "DD/MM/YYYY HH:mm",
        "MM/DD/YYYY HH:mm:ss",
        "MM/DD/YYYY HH:mm",
        moment.ISO_8601,
      ], true);

      if (parsed.isValid()) {
        return parsed.format("YYYY-MM-DD HH:mm:ss");
      }

      const fallback = moment(value);
      return fallback.isValid()
        ? fallback.format("YYYY-MM-DD HH:mm:ss")
        : String(value);
    },
    normalizeCourtName(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    },
    mapCourtIdsFromName() {
      if (!this.matches_file.length || !this.provider_courts.length) {
        return;
      }

      const courtIdByName = new Map(
        this.provider_courts.map((court) => [
          this.normalizeCourtName(court.name),
          court.id,
        ])
      );

      this.matches_file = this.matches_file.map((match) => ({
        ...match,
        court_id:
          courtIdByName.get(this.normalizeCourtName(match.court_name)) || null,
      }));
    },
    onProviderTokenInput() {
      if (this.tokenCheckTimeout) {
        clearTimeout(this.tokenCheckTimeout);
      }

      this.tokenCheckTimeout = setTimeout(() => {
        this.checkToken();
      }, 500);
    },
    handleImportClick() {
      if (!this.provider_token) {
        Swal.fire({
          title: "Missing Token",
          text: "Please fill provider token before importing.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      if (!this.toImportMatches.length) {
        Swal.fire({
          title: "No Table Rows",
          text: "Please import a file so the table has rows before importing.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      if (!this.courtsIsCompatible) {
        const missingCourts = this.unmatchedCourtNames.join(",\n");
        Swal.fire({
          title: "Courts Not Compatible",
          text: missingCourts
            ? `These courts were not found in provider:\n${missingCourts}`
            : "Please make sure file courts match provider courts before importing.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      if (this.toImportMatches.some((match) => !match.court_id)) {
        Swal.fire({
          title: "Missing Court Mapping",
          text: "Some rows cannot find court_id from court_name. Please check court names.",
          icon: "warning",
          confirmButtonText: "OK",
        });
        return;
      }

      this.proceedImport();
    },
    startCountDown() {
      this.totalTimeNeeded = this.toImportMatches.length * 2;
      this.countdownText = moment
        .utc(this.totalTimeNeeded * 1000)
        .format("HH:mm:ss");

      const interval = setInterval(() => {
        this.totalTimeNeeded -= 1;
        this.countdownText = moment
          .utc(this.totalTimeNeeded * 1000)
          .format("HH:mm:ss");

        if (this.totalTimeNeeded <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    },
    async proceedImport() {
      this.startCountDown();
      this.importing = true;
      const total = this.toImportMatches.length;
      let finished = 0;
      const startedAtMs = Date.now();

      Swal.fire({
        toast: true,
        icon: "info",
        title: `Importing... Finished ${finished} / Total ${total}`,
        position: "top-end",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });

      const token = (this.provider_token || "").trim();
      const createMatchUrl = "https://arena.matchday-backend.com/arena/create-match";
      try {
        for (const match of this.toImportMatches) {
          const createPayload = {
            courts: [String(match.court_id)],
            fixed_price: null,
            fixed_price_obj: null,
            member_id: null,
            method: "fast-create",
            payment: "cash",
            payment_multi: false,
            promotion_id: null,
            settings: {
              name: match.booking_name || "Guest",
              phone_number: this.sanitizePhoneNumber(match.booking_phone),
            },
            time_end: match.time_end,
            time_start: match.time_start,
            user_id: null,
          };

          const createRes = await axios.post(createMatchUrl, createPayload, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const createdMatch =
            createRes?.data?.matches?.[0] || createRes?.data?.match || null;
          const createdMatchId =
            createdMatch?.id || createdMatch?.match_id || createdMatch?.code;

          if (createdMatchId) {
            const createdTimeStart = createdMatch?.time_start || match.time_start;
            const createdTimeEnd = createdMatch?.time_end || match.time_end;
            const createdName =
              createdMatch?.booking_name ||
              createdMatch?.name ||
              match.booking_name ||
              "";
            const createdPhone = this.sanitizePhoneNumber(
              createdMatch?.booking_phone ||
                createdMatch?.phone_number ||
                match.booking_phone
            );
            const updatePricePayload = {
              change_price: this.normalizeAmount(match.match_price),
              description: `${createdName} ${createdPhone}`.trim(),
              remark: null,
              time_end: createdTimeEnd,
              time_start: createdTimeStart,
            };

            await axios.put(
              `https://arena.matchday-backend.com/arena/match/${createdMatchId}`,
              updatePricePayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }

          const paidAmount = this.normalizeAmount(match.paid_amount);
          if (paidAmount > 0 && createdMatchId) {
            const paidAt = moment().format("YYYY-MM-DD HH:mm:ss");
            const paymentPayload = {
              cash_received: 0,
              change: 0 - paidAmount,
              check_in: 1,
              paid_amount: paidAmount,
              paid_at: paidAt,
              payment_multi: false,
              payment_status: "offline",
              type: "match,addon",
            };

            await axios.put(
              `https://arena.matchday-backend.com/arena/match/${createdMatchId}`,
              paymentPayload,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }

          finished += 1;
          const elapsedSeconds = (Date.now() - startedAtMs) / 1000;
          const avgSeconds = elapsedSeconds / finished;
          this.avgSecondsPerMatch = avgSeconds;
          const remainingSeconds = Math.max(
            0,
            Math.ceil((total - finished) * avgSeconds)
          );
          this.countdownText = moment
            .utc(remainingSeconds * 1000)
            .format("HH:mm:ss");
          Swal.update({
            title: `Importing... Finished ${finished} / Total ${total} (${this.countdownText} left)`,
          });
        }

        Swal.close();
        this.importing = false;
        if (finished > 0) {
          localStorage.setItem(
            "import_avg_seconds_per_match",
            String(this.avgSecondsPerMatch)
          );
        }
        Swal.fire({
          title: "Imported!",
          text: `Matches created successfully (${finished}/${total})`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (err) {
        console.log(err);
        Swal.close();
        this.importing = false;
        if (finished > 0) {
          localStorage.setItem(
            "import_avg_seconds_per_match",
            String(this.avgSecondsPerMatch)
          );
        }
        Swal.fire({
          title: "Error!",
          text: `An error occured while creating matches or updating payments (Finished ${finished}/${total})`,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    },
    async checkToken() {
      const token = (this.provider_token || "").trim();

      if (!token) {
        this.provider_courts = [];
        this.provider_name = "";
        return;
      }

      this.checking_provider = true;
      httpClient({ requiresAuth: false })
        .get("/arena/profile", {
          params: {
            role: "sp",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res?.data) {
            const courts = [];
            (res.data.provider_sports || []).forEach((sport) => {
              (sport.court_types || []).forEach((court_type) => {
                (court_type.courts || []).forEach((court) => {
                  courts.push(court);
                });
              });
            });

            this.provider_courts = courts;
            this.provider_name = res.data.fullname;
            console.log("Provider court list:", courts);
            this.mapCourtIdsFromName();
          }
        })
        .catch((err) => {
          console.log(err);
          this.provider_courts = [];
          this.provider_name = "";
        })
        .finally(() => {
          this.checking_provider = false;
        });
    },
    async importHandler() {
      return new Promise((resolve, reject) => {
        //Take file input xlsx
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xlsx";
        input.onchange = (e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const listJson = XLSX.utils.sheet_to_json(sheet);

            const list = listJson;

            if (list.length > 0) {
              resolve(list);
            } else {
              reject("No data found");
            }
          };
          reader.readAsArrayBuffer(file);
        };
        input.click();
      });
    },
    getCourtsFromMatches(matches) {
      const uniqueCourts = [
        ...new Set(matches.map((match) => match.court_name)),
      ].sort((a, b) => a.localeCompare(b));

      return uniqueCourts;
    },
    importFile() {
      this.importHandler().then((res) => {
        this.matches_file = res.map((match, i) => {
          return {
            no: i + 1,
            ...match,
            booking_phone: this.sanitizePhoneNumber(match.booking_phone),
            time_start: this.normalizeDateTime(match.time_start),
            time_end: this.normalizeDateTime(match.time_end),
          };
        });

        this.founded_courts = this.getCourtsFromMatches(this.matches_file);
        this.mapCourtIdsFromName();
      });
    },
  },
};
</script>
