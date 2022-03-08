---
id: dna-sanger-wxs-vc
title: Sanger WXS Variant Calling
sidebar_label: Sanger WXS Variant Calling
platform_key: DOCS_DNA_PIPELINE
---

Whole exome sequencing (WXS) aligned CRAM files are processed through the Sanger WXS Variant Calling Workflow as tumour/normal pairs. The ARGO DNA Seq pipeline has adopted the [Sanger Whole Exome Sequencing Analysis Docker Image](https://quay.io/wtsicgp/dockstore-cgpwxs:3.1.6) as the base workflow. For details, please see the latest version of the [ARGO Sanger WXS Variant Calling workflow](https://github.com/icgc-argo-workflows/sanger-wxs-variant-calling/releases).

## Inputs

- Normal WXS aligned CRAM and index files
- Tumour WXS aligned CRAM and index files
- [Reference files](ftp://ftp.sanger.ac.uk/pub/cancer/dockstore/human/GRCh38_hla_decoy_ebv)

## Processing

- `Pindel` InDel caller is used for somatic insertion/deletion variant detection.
- `CaVEMan` SNV caller is used for somatic single nucleotide variant analysis.

## Collect QC Metrics

- WXS aligned reads statistics are generated by [Sanger:bam_stats](https://github.com/ICGC-TCGA-PanCancer/PCAP-core/blob/master/bin/bam_stats.pl) script. The files containing normal/tumour aligned reads statistics are further used by Pindel caller.

## Outputs

- [Raw SNV Calls](/docs/data/variant-calls#raw-snv-calls) and [VCF Index](/docs/data/variant-calls#vcf-index)
- [Raw InDel Calls](/docs/data/variant-calls#raw-indel-calls) and [VCF Index](/docs/data/variant-calls#vcf-index)
- [SNV Supplement](/docs/data/variant-calls#snv-supplement) files
- [InDel Supplement](/docs/data/variant-calls#indel-supplement) files
- QC Metrics
  - [Alignment Metrics](/docs/data/qc-metrics#aligned-reads-qc) for both the Tumour and Normal samples
  - [Runtime Stats](/docs/data/qc-metrics#analysis-qc)

## Workflow Diagram

![Sanger WXS Variant Calling Workflow](/assets/analysis-workflows/ARGO-WXS-variant-calling.png)